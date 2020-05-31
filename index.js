const fs = require('fs')
const state = require('./robots/state.js')


const robots = {
    spreadsheet: require('./robots/spreadsheet.js')
}

async function start(){

    await robots.spreadsheet()

    const content = state.load()

    console.log(content,null,4)

}

start()