# mailchimp-cognito-import

## Concepts
This tool helps you import AWS Cognito users to the contact list in MailChimp.

It does not override your current contacts, a contact that already exists will just be skipped

## In action
![mailchimp-cognito-import CLI](https://i.imgur.com/jPOFgSK.jpg)

## Usage

### Before you start

In order to import users from cognito to your mailchimp account, you need 3 things:
1. Cognito userPoolId of the user pool that contains the users you want to add to mailchimp.
2. MailChimp API key: [How to get one](https://mailchimp.com/help/about-api-keys/#Find_or_generate_your_API_key
)
3. MailChimp list ID: [Where to find it](https://mailchimp.com/help/about-api-keys/#Find_or_generate_your_API_key
)

If you run on your local machine, also make sure that your AWS profile credentials are set in  _~/.aws/credentials_


### Installation

If you want to use within a project
```
npm install --add mailchimp-cognito-import
```

If you want to install globally and run from anywhere
```
npm install -g mailchimp-cognito-import
```

### Run

#### Use with CLI (global install)

```
mailchimp-cognito-import <user-pool-id> <mailchimp-api-key> <mailchimp-list-id> 
```

You can also show the help prompt by running without args.

```
mailchimp-cognito-import
```


