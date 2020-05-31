const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')
const credentials = require('../credentials/google-spreadsheet.json')
const state = require('./state.js')

const headers = {
    cardHeader: "CARTÃO",
    bankHeader: "BANCO"
}

async function robot(){
    const content = []

    const spreadsheetDocument = await accessSpreadsheet()
    await authenticateSpreadsheet(spreadsheetDocument)
    const spreadsheetRows = await readAllRows(spreadsheetDocument)
    await organizeAllRows(spreadsheetRows)
    
    state.save(content)

    async function accessSpreadsheet(){
        const spreadsheetDocument = new GoogleSpreadsheet(credentials.documentId)
        return spreadsheetDocument
    }
    
    async function authenticateSpreadsheet(spreadsheetDocument){
        await promisify(spreadsheetDocument.useServiceAccountAuth)(credentials)
    }

    async function readAllRows(spreadsheetDocument){
        const info = await promisify(spreadsheetDocument.getInfo)()
        const sheet = info.worksheets[0]
    
        const rows = await promisify(sheet.getRows)({
            offset: 2,
            limit: sheet.rowCount
        })
        
        content.title = sheet.title
        content.numRows = sheet.rowCount

        return rows
    }

    async function organizeAllRows(spreadsheetRows){
        let actualHeader
        let actualOwner
        content.card = []
        content.bank = []
        for(let spreadsheetRowIndex in spreadsheetRows){
            if(spreadsheetRows[spreadsheetRowIndex]._cn6ca !== undefined){
                actualHeader = spreadsheetRows[spreadsheetRowIndex]._cn6ca
            }
            
            if(spreadsheetRows[spreadsheetRowIndex]._cokwr !== undefined){
                if(spreadsheetRows[spreadsheetRowIndex]._cokwr !== actualOwner){
                    actualOwner = spreadsheetRows[spreadsheetRowIndex]._cokwr
                    if(actualHeader = headers.cardHeader){
                        content.card.push({
                            name: actualOwner
                        })
                    }else if(actualHeader = headers.bankHeader){
                        content.bank.push({
                            name: actualOwner
                        })
                    }
                }
            }
        }
        console.log(content,null,4)
    }
}

module.exports = robot