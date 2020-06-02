const { GoogleSpreadsheet }  = require('google-spreadsheet')
const { promisify } = require('util')
const state = require('./state.js')
const credential = require('./credentials.js')

const EntityType = Object.freeze({"CARTÃO":"Card", "BANCO":"Bank"})

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
    console.log(r)
    console.log(g)
    console.log(b)
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

async function robot(){
    const content = {}

    const credentials = await credential()
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
        await spreadsheetDocument.useServiceAccountAuth(credentials);  
    }

    async function readAllRows(spreadsheetDocument){
        
        const rows = []
        await spreadsheetDocument.loadInfo();
        const sheet = spreadsheetDocument.sheetsByIndex[1];
    
        await sheet.loadCells({
            endRowIndex: sheet.rowCount-27
        })
        
        content.title = sheet.title
        content.numRows = sheet.rowCount-27
        content.numCols = sheet.columnCount
        
        for(let rowIndex = 0; rowIndex < content.numRows; rowIndex++){
            for(let colIndex = 0; colIndex < content.numCols; colIndex++){
                rows.push(sheet.getCell(rowIndex,colIndex))
            }
        }

        return rows
    }

    async function organizeAllRows(spreadsheetContent){
        content.availableMonths = await getAllAvailableMonths(spreadsheetContent) //OK
        content.availableEntities = await getAllAvailableEntities(spreadsheetContent)
        content.entries = await getAllEntries(spreadsheetContent)
        

        async function getAllAvailableMonths(spreadsheetContent){
            const availableMonths = []
            
            return new Promise((resolve,reject)=>{
                let year = spreadsheetContent.filter((row) => row._row == 0 && row._column == 2).map(row => {return row.value})[0]
                
                const firstRowsColumns = spreadsheetContent.filter((row) => row._row == 0 && row._column > 2 && row.value != '')
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
                const rowHeadersAndEntityName = spreadsheetContent.filter((content) => content._column < 2 && content.value != null)
                
                for(let rowHeaderIndex in rowHeadersAndEntityName){
                    if(rowHeadersAndEntityName[rowHeaderIndex]._column == 0){
                        actualHeader = rowHeadersAndEntityName[rowHeaderIndex].value
                        
                        //console.log(rowHeadersAndEntityName[rowHeaderIndex]._rawData.effectiveFormat.backgroundColor,null,4)
                    }
                    if(rowHeadersAndEntityName[rowHeaderIndex]._column == 1){
                        
                        let red = rowHeadersAndEntityName[rowHeaderIndex]._rawData.effectiveFormat.backgroundColor.red
                        let green = rowHeadersAndEntityName[rowHeaderIndex]._rawData.effectiveFormat.backgroundColor.green
                        let blue = rowHeadersAndEntityName[rowHeaderIndex]._rawData.effectiveFormat.backgroundColor.blue

                        red = red != null ? red : 0
                        green = green != null ? green : 0
                        blue = blue != null ? blue : 0

                        availableEntities.push({
                            type: EntityType[actualHeader],
                            name: rowHeadersAndEntityName[rowHeaderIndex].value,
                            color: {red,green,blue}
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
                                        type: parseFloat(rowsEntries[0].replace("R$ ","").replace(",",".")) > 0 ? 'Credit' : 'Debit'
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