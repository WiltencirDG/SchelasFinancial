const robots = {
    spreadsheet: require('./robots/spreadsheet.js'),
    server: require('./robots/server.js')
}

async function start(){
    
    await robots.spreadsheet()
    await robots.server()


}

start()