var express = require("express");
const state = require('./robots/state.js')
const http = require('http')
const port = process.env.PORT
const robots = {
    spreadsheet: require('./robots/spreadsheet.js')
}

const app = express();

async function start(){
    
    const server = await createServer()
    await robots.spreadsheet()
    const content = state.load()
    await apiCalls()

    //console.dir(content, {depth: null})
    
    async function createServer(){
        return new Promise((resolve, reject) => {
            const server = app.listen(port, (error) => {
                if(error){
                    reject(error)
                }
                console.log(`App now running on: ${server.address()}:${port}`);
                resolve(server)
            });

        })
    }

    async function apiCalls(){
        app.get("/index.js", (req, res) => {
            res.statusCode = 200
            res.end(JSON.stringify(content))
        });
    }

}

start()