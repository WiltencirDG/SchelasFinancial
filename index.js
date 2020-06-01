const state = require('./robots/state.js')
const http = require('http')
const port = 443
const robots = {
    spreadsheet: require('./robots/spreadsheet.js')
}

async function start(){
    
    await robots.spreadsheet()

    const content = state.load()

    //console.dir(content, {depth: null})

    const server = http.createServer((request, response) => {
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.end(content)
    })

    server.listen(port, () => {
        console.log('Server started at: https://schelas-financial.herokuapp.com/index.js')
    })
    

}

start()