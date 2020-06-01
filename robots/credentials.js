const aws = require('aws-sdk');
const fs = require('fs')

let credentialsOff
if(fs.existsSync('../credentials/google-spreadsheet.json')){
    credentialsOff = require('../credentials/google-spreadsheet.json')
}

async function robot(){
    return await getCredentials()

    async function getCredentials(){
        return new Promise((resolve, reject) => {
            const credentialsAWS = new aws.S3({
                type: process.env.S3_type || credentialsOff.type,
                project_id: process.env.S3_project_id || credentialsOff.project_id,
                private_key_id: process.env.S3_private_key_id || credentialsOff.private_key_id,
                private_key: process.env.S3_private_key !== undefined ? process.env.S3_private_key.replace(/\\n/gm, '\n') : credentialsOff.private_key,
                client_email: process.env.S3_client_email || credentialsOff.client_email,
                client_id: process.env.S3_client_id || credentialsOff.client_id,
                auth_uri: process.env.S3_auth_uri || credentialsOff.auth_uri,
                token_uri: process.env.S3_token_uri || credentialsOff.token_uri,
                auth_provider_x509_cert_url: process.env.S3_auth_provider_x509_cert_url || credentialsOff.auth_provider_x509_cert_url,
                client_x509_cert_url: process.env.S3_client_x509_cert_url || credentialsOff.client_x509_cert_url,
                documentId: process.env.S3_documentId || credentialsOff.documentId
            });
            
            const credentials = {
                type: credentialsAWS.config.type || credentialsAWS.type,
                project_id: credentialsAWS.config.project_id || credentialsAWS.project_id,
                private_key_id: credentialsAWS.config.private_key_id || credentialsAWS.private_key_id,
                private_key: credentialsAWS.config.private_key || credentialsAWS.private_key,
                client_email: credentialsAWS.config.client_email || credentialsAWS.client_email,
                client_id: credentialsAWS.config.client_id || credentialsAWS.client_id,
                auth_uri: credentialsAWS.config.auth_uri || credentialsAWS.auth_uri,
                token_uri: credentialsAWS.config.token_uri || credentialsAWS.token_uri,
                auth_provider_x509_cert_url: credentialsAWS.config.auth_provider_x509_cert_url || credentialsAWS.auth_provider_x509_cert_url,
                client_x509_cert_url: credentialsAWS.config.client_x509_cert_url || credentialsAWS.client_x509_cert_url,
                documentId: credentialsAWS.config.documentId || credentialsAWS.documentId 
            }

            resolve(credentials)
        })
    }
}

module.exports = robot