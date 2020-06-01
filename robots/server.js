const port = process.env.PORT || 8080
const spreadsheet = require('./spreadsheet.js')
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
                console.log(`Server now running on: ${server.address().address}:${port}`);
                resolve(server)
            });

        })
    }

    async function apiCalls(app){
        app.get("/index.js", async (req, res) => {
            const content = await spreadsheet()

            res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.statusCode = 200
            res.end(JSON.stringify(content))
        });
    }

}

module.exports = robot