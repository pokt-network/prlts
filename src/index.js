const Environment = require("dotenv")
const Configuration = require("./configuration")
const Logger = require("./logger")
const TestType = require("./test-type")
let Relayer = undefined

// Load env variables
Environment.config()
const configFileDir = process.env.PRLTS_CONFIG_FILE

// Load arguments
const args = process.argv.slice(2)
let testType
if (args.length === 0) {
    testType = TestType.DISPATCH
} else {
    testType = TestType.getTestType(args[0])
}

try {
    // Create configuration object
    const configuration = new Configuration(configFileDir, testType)

    // Create logger
    const logger = new Logger(configuration)

    // Log mode
    logger.log("info", `Starting PRLTS in ${testType} mode`)

    // Log the configuration
    logger.log("debug", "PRLTS Configuration", configuration)

    // Create Relayer based on test type
    Relayer = require(`./relayer/${testType.toLowerCase()}`)
    relayer = new Relayer(configuration, logger)

    // Start the Relayer
    logger.log("debug", "Starting Relayer")
    relayer.start()
} catch(err) {
    console.error(err)
}