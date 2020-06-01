const port = process.env.PORT || 8080
const state = require('./state.js')
var express = require("express");

async function robot(){

    const app = express();
    
    const webServer = await createServer(app)
    await apiCalls(app)
    //await finishServer(webServer)
    
    async function createServer(app){
        return new Promise((resolve, reject) => {
            const server = app.listen(port, (error) => {
                if(error){
                    reject(error)
                }
                console.log(`App now running on: ${server.address().address}:${port}`);
                resolve(server)
            });

        })
    }

    async function apiCalls(app){
        const content = state.load()
        app.get("/index.js", (req, res) => {
            res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.statusCode = 200
            res.end(JSON.stringify(content))
        });
    }

    async function finishServer(webServer){
        return new Promise((resolve, reject) => {
            webServer.close(() => {
                resolve()
            })
        })
    }
}

module.exports = robot