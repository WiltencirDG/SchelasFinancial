const GoogleSpreadsheet = require('google-spreadsheet')
const aws = require('aws-sdk');
const { promisify } = require('util')
const state = require('./state.js')

//const credentials = require('../credentials/google-spreadsheet.json')
const credentialsAWS = new aws.S3({
    type: process.env.S3_type,
    project_id: process.env.S3_project_id,
    private_key_id: process.env.S3_private_key_id,
    private_key: process.env.S3_private_key,
    client_email: process.env.S3_client_email,
    client_id: process.env.S3_client_id,
    auth_uri: process.env.S3_auth_uri,
    token_uri: process.env.S3_token_uri,
    auth_provider_x509_cert_url: process.env.S3_auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.S3_client_x509_cert_url,
    documentId: process.env.S3_documentId
});

const credentials = {
    type: credentialsAWS.Service.type,
    project_id: credentialsAWS.Service.project_id,
    private_key_id: credentialsAWS.Service.private_key_id,
    private_key: credentialsAWS.Service.private_key,
    client_email: credentialsAWS.Service.client_email,
    client_id: credentialsAWS.Service.client_id,
    auth_uri: credentialsAWS.Service.auth_uri,
    token_uri: credentialsAWS.Service.token_uri,
    auth_provider_x509_cert_url: credentialsAWS.Service.auth_provider_x509_cert_url,
    client_x509_cert_url: credentialsAWS.Service.client_x509_cert_url,
    documentId: credentialsAWS.Service.documentId
}

const EntityType = Object.freeze({"CARTÃO":"Card", "BANCO":"Bank"})

async function robot(){
    const content = {}

    const spreadsheetDocument = await accessSpreadsheet()
    await authenticateSpreadsheet(spreadsheetDocument)
    const spreadsheetContent = await readAllRows(spreadsheetDocument)
    
    await organizeAllRows(spreadsheetContent)
    
    state.save(content)

    async function accessSpreadsheet(){
        console.log(credentials.documentId)
        const spreadsheetDocument = new GoogleSpreadsheet(credentials.documentId)
        return spreadsheetDocument
    }
    
    async function authenticateSpreadsheet(spreadsheetDocument){
        await promisify(spreadsheetDocument.useServiceAccountAuth)(credentials)
    }

    async function readAllRows(spreadsheetDocument){
        const info = await promisify(spreadsheetDocument.getInfo)()
        const sheet = info.worksheets[1]
    
        const rows = await promisify(sheet.getCells)({
            'min-row': 1,
            'max-row': sheet.rowCount-27,
            'min-col': 1,
            'max-col': sheet.colCount,
            'return-empty': true
        })
        
        content.title = sheet.title
        content.numRows = sheet.rowCount
        content.numCols = sheet.colCount

        return rows
    }

    async function organizeAllRows(spreadsheetContent){
        content.availableMonths = await getAllAvailableMonths(spreadsheetContent)
        content.availableEntities = await getAllAvailableEntities(spreadsheetContent)
        //await getEntitiesColor(content.availableEntities)
        content.entries = await getAllEntries(spreadsheetContent)
        

        async function getAllAvailableMonths(spreadsheetContent){
            const availableMonths = []
            
            return new Promise((resolve,reject)=>{
                let year = spreadsheetContent.filter((row) => row.row == 1 && row.col == 3).map(row => {return row.value})[0]
                
                const firstRowsColumns = spreadsheetContent.filter((row) => row.row == 1 && row.col > 3 && row.value != '')
                firstRowsColumns.map(item => {
                    if(item.value == 'JANEIRO'){year++}

                    availableMonths.push({
                        year: year.toString(),
                        month: item.value
                    })                          
                })
                
                if(availableMonths.length == 0){
                    reject('Error reading the spreadsheet')
                }
                
                resolve(availableMonths)

            })
        }

        async function getAllAvailableEntities(spreadsheetContent){
            const availableEntities = []
            let actualHeader
            return new Promise((resolve,reject)=>{
                const rowHeadersAndEntityName = spreadsheetContent.filter((content) => content.col < 3 && content._value != '')

                for(let rowHeaderIndex in rowHeadersAndEntityName){
                    if(rowHeadersAndEntityName[rowHeaderIndex].col == 1){
                        actualHeader = rowHeadersAndEntityName[rowHeaderIndex]._value
                    }
                    if(rowHeadersAndEntityName[rowHeaderIndex].col == 2){
                        availableEntities.push({
                            type: EntityType[actualHeader],
                            name: rowHeadersAndEntityName[rowHeaderIndex]._value,
                            color: ''
                        })
                    }
                }

                resolve(availableEntities)
            })
        }

        async function getAllEntries(spreadsheetContent){
            const entries = []
            return new Promise((resolve, reject) => {
                let year, actualEntity, actualHeader, rowsEntries, rowsEntryDescription, rowsEntity, rowsEntityName, rowsMonth
                console.log(rowsMonth,null,4)
                for(let rowIndex = 1; rowIndex <= content.numRows; rowIndex++){
                    year = spreadsheetContent.filter((row) => row.row == 1 && row.col == 3).map(row => {return row.value})[0]
                    for(let colIndex = 4; colIndex <= content.numCols; colIndex++){

                        rowsMonth = spreadsheetContent.filter((content) => content.col == colIndex && content.row == 1 && content._value != '').map((item) => {return item.value})
                        rowsEntries = spreadsheetContent.filter((content) => content.col == colIndex && content.row == rowIndex && content._value != '').map((item) => {return item.value})
                        rowsEntryDescription = spreadsheetContent.filter((content) => content.col == 3 && content.row == rowIndex && content._value != '').map((item) => {return item.value})
                        rowsEntity = spreadsheetContent.filter((content) => content.col == 1 && content.row == rowIndex && content._value != '').map((item) => {return item._value})
                        rowsEntityName = spreadsheetContent.filter((content) => content.col == 2 && content.row == rowIndex && content._value != '').map((item) => {return item.value})
                        
                        if(rowsEntity[0] !== undefined){ actualHeader = rowsEntity[0] }

                        if(rowsEntityName[0] !== undefined){ actualEntity = rowsEntityName[0] }
                        
                        if(rowsMonth[0] == 'JANEIRO'){ year++ }                        

                        if(rowsEntries[0] != null && rowsEntryDescription[0] != null && actualHeader !== undefined && actualEntity !== undefined){
                            
                            entries.push({
                                entries:{
                                    type: EntityType[actualHeader], 
                                    name: actualEntity,
                                    color: '',
                                    entry:{
                                        year: year.toString(),
                                        month: rowsMonth[0],
                                        description: rowsEntryDescription[0],
                                        value: rowsEntries[0],
                                        type: 'Debit'
                                    }
                                }
                            })
                        }
                    }
                }
                //process.exit(0)
                resolve(entries)
            })
        }
    }
}

module.exports = robot