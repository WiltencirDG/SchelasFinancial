const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')
const credentials = require('../credentials/google-spreadsheet.json')
const state = require('./state.js')

const EntityType = Object.freeze({"CARTÃO":"Card", "BANCO":"Bank"})

async function robot(){
    const content = {}

    const spreadsheetDocument = await accessSpreadsheet()
    await authenticateSpreadsheet(spreadsheetDocument)
    const spreadsheetContent = await readAllRows(spreadsheetDocument)
    await organizeAllRows(spreadsheetContent)
    
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
                const rowsMonth = spreadsheetContent.filter((content) => content.col > 0 && content.row == 1 && content._value != '').map((item) => {return item.value})
                const rowsEntity = spreadsheetContent.filter((content) => content.col == 1 && content._value != '').map((item) => {return item.value})
                const rowsEntityName = spreadsheetContent.filter((content) => content.col == 2 && content.row > 0 && content._value != '').map((item) => {return item.value})
                const rowsEntryDescription = spreadsheetContent.filter((content) => content.col == 3 && content.row > 0 && content._value != '').map((item) => {return item.value})
                const rowsEntries = spreadsheetContent.filter((content) => content.col > 3 && content.row > 0 && content._value != '').map((item) => {return item.value})

                let year, actualEntity, actualHeader
                console.log(rowsMonth,null,4)
                for(let rowIndex = 0; rowIndex < content.numRows; rowIndex++){
                    year = spreadsheetContent.filter((row) => row.row == 1 && row.col == 3).map(row => {return row.value})[0]
                    for(let colIndex = 0; colIndex < content.numCols; colIndex++){

                        if(rowsEntity[rowIndex] != undefined){ actualHeader = rowsEntity[rowIndex] }

                        if(rowsEntityName[rowIndex] != undefined){ actualEntity = rowsEntityName[rowIndex] }

                        if(rowsMonth[colIndex] == 'JANEIRO'){ year++ }
                        
                        

                        entries.push({
                            entries:{
                                type: EntityType[actualHeader], 
                                name: actualEntity,
                                color: '',
                                entry:{
                                    year: year.toString(),
                                    month: rowsMonth[colIndex],
                                    description: rowsEntryDescription[rowIndex],
                                    value: rowsEntries[colIndex],
                                    type: 'Debit'
                                }
                            }
                        })
                    }
                }

                resolve(entries)
            })
        }
    }
}

module.exports = robot