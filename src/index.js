const Environment = require("dotenv")
const Configuration = require("./configuration")
const Logger = require("./logger")
let Relayer = undefined

// Load env variables
Environment.config()
const configFileDir = process.env.PRLTS_CONFIG_FILE

try {
    // Create configuration object
    const configuration = new Configuration(configFileDir)

    // Create logger
    const logger = new Logger(configuration)

    // Log the configuration
    logger.log("debug", "PRLTS Configuration", configuration)

    // Create Relayer
    if (configuration.dispatchers && configuration.dispatchers.length > 0) {
        Relayer = require("./relayer/dispatch")
    } else if (configuration.gateway && configuration.gateway.length > 0) {
        Relayer = require("./relayer/gateway")
    } else {
        throw new Error("Unable to load configuration; missing dispatchers and gateway")
    }
    relayer = new Relayer(configuration, logger)
    
    // Start the Relayer
    logger.log("debug", "Starting Relayer")
    relayer.start()
} catch(err) {
    console.error(err)
}