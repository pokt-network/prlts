const Environment = require("dotenv")
const Configuration = require("./configuration")
const Logger = require("./logger")
const Relayer = require("./relayer")

// Load env variables
Environment.config()
const configFileDir = process.env.PRTLS_CONFIG_FILE

try {
    // Create configuration object
    const configuration = new Configuration(configFileDir)

    // Create logger
    const logger = new Logger(configuration)

    // Log the configuration
    logger.log("debug", "PRLTS Configuration", configuration)

    // Create Relayer
    const relayer = new Relayer(configuration, logger)

    // Start the Relayer
    logger.log("debug", "Starting Relayer")
    relayer.start()
} catch(err) {
    console.error(err)
}