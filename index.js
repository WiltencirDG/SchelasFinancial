const robots = {
    server: require('./robots/server.js')
}

async function start(){
    
    await robots.server()

}

start()