const port = process.env.PORT
const state = require('./state.js')
var express = require("express");

async function robot(){

    const app = express();

    await createServer(app)
    await apiCalls(app)

    async function createServer(app){
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

    async function apiCalls(app){
        const content = state.load()
        app.get("/index.js", (req, res) => {
            res.statusCode = 200
            res.end(JSON.stringify(content))
        });
    }
}

module.exports = robot