'use strict';

var AWS = require('aws-sdk');
var assert = require('assert');
var meow = require('meow');
const term = require('terminal-kit').terminal;
const bluebird = require('bluebird');
const time = require('./timer.js');
const axios = require('axios')


const cli = meow(`
    Usage
      mailchimp-cognito-import <user-pool-id> <mailchimp-api-key> <mailchimp-list-id> 
    
      AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY can be specified in env variables or ~/.aws/credentials
      
      --------
    Useful links
      How to get Mailchimp API key:          https://mailchimp.com/help/about-api-keys/#Find_or_generate_your_API_key
      How to get Mailchimp Audience List ID: https://mailchimp.com/help/find-audience-id/
`);


function CognitoToMailChimp(cognitoUserPoolId, mcApiKey, mcListId) {
    var self = this

    assert.notEqual(cognitoUserPoolId, undefined, 'Requires AWS UserPoolId.');
    assert.notEqual(mcApiKey, undefined, 'Mailchimp ApiKey Required.');
    assert.notEqual(mcListId, undefined, 'Mailchimp list ID Required.');

    self.init(cognitoUserPoolId, mcApiKey, mcListId);
}


CognitoToMailChimp.prototype = {
    init: function (cognitoUserPoolId, mcApiKey, mcListId) {

        var self = this

        this.UserPoolId = cognitoUserPoolId
        this.mcApiKey = mcApiKey
        this.mcListId = mcListId

        const region = this.UserPoolId.substring(0, this.UserPoolId.indexOf('_'));

        self.cognitoIsp = new AWS.CognitoIdentityServiceProvider({region});
    },

    importUsers: async function (token, requestNumber = 1, attemptNumber = 1) {
        const promise = bluebird.resolve(this.cognitoIsp.listUsers({
            UserPoolId: this.UserPoolId,
            PaginationToken: token,
        }).promise());


        let nextToken;
        let nextRequestNumber;
        let nextAttemptNumber;

        try {
            const {
                Users,
                PaginationToken,
            } = await promise;

            for (const user in Users) {
                const currentEmail = Users[user].Attributes.filter(attr => (attr.Name === "email"))[0].Value

                // add contact to mailChimp
                try {
                    let contactCreation = await addContactMailChimp(this.mcApiKey,
                        this.mcListId,
                        {email: currentEmail}
                    )

                    term(`${currentEmail} \t\t\t`).green(`success - added\n`)

                } catch (e) {
                    if (e.response && e.response.data && e.response.data.title) {
                        term(`${currentEmail} \t\t\t`).red(`fail - ${e.response.data.title}\n`);
                    } else {
                        term(`${currentEmail} \t\t\t`).red(`fail - ${e.toLocaleString()}\n`);
                    }
                }
            }


            time.resetWaitTime();

            nextRequestNumber = requestNumber + 1;
            nextAttemptNumber = 1;

            nextToken = PaginationToken;
        } catch (e) {
            term(`Request #${requestNumber} (attempt#: ${attemptNumber}): `).red(`fail - ${e.code}\n`);

            await time.wait();
            time.increaseWaitTime();

            nextToken = token;
            nextRequestNumber = requestNumber;
            nextAttemptNumber = attemptNumber + 1;
        }

        if (nextToken === undefined) {
            term.cyan('Import Complete\n');
        } else {
            this.getUsers(nextToken, nextRequestNumber, nextAttemptNumber);
        }
    },


}


/**
 *
 * @param mailChimpApiKey: the api key of mailchimp
 * @see {@link https://mailchimp.com/help/about-api-keys/#Find_or_generate_your_API_key}
 *
 * @param listId: mailChimp audience ID
 * @see {@link https://mailchimp.com/help/find-audience-id/}
 *
 * @param contactInfo an object containing the email of user
 * @returns {Promise<AxiosResponse<T>>}
 */
async function addContactMailChimp(mailChimpApiKey, listId, contactInfo) {

    const apiKey = mailChimpApiKey
    const dc = mailChimpApiKey.split("-")[1]

    let contactInfos = {
        "email_address": contactInfo.email,
        "status": "subscribed",
    }

    return await axios.post(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
        contactInfos, {
            auth: {
                username: 'anystring',  // this can be anything
                password: apiKey
            },
        })
}





/*
 * *****************************************
 * USAGE WITH CLI
 * *****************************************
 */
if (!cli.input[0] || !cli.input[1] || !cli.input[2]) {
    cli.showHelp();
}


let UserPoolId = cli.input[0]
let mcApiKey = cli.input[1]
let mcListId = cli.input[2]

let congtmc = new CognitoToMailChimp(UserPoolId, mcApiKey, mcListId)
congtmc.importUsers()






module.exports = CognitoToMailChimp;




