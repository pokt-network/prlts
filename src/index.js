const Environment = require("dotenv")
const Server = require("./server")
const Logger = require("./logger")

// Load env variables
Environment.config()
const configFileDir = process.env.PRTLS_CONFIG_FILE

// Create the logger
const logger = new Logger("info")

// Create a new server object
try {
    const server = new Server(configFileDir, logger)
    server.start()
} catch (error) {
    logger.error(error.message, error)
}
