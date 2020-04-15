const Environment = require("dotenv")
const Server = require("./server")

// Load env variables
Environment.config()
const configFileDir = process.env.PRTLS_CONFIG_FILE

// Create a new server object
const server = new Server(configFileDir)
server.start()