const Environment = require("dotenv")
const Configuration = require("./configuration")

// Load env variables
Environment.config()
const configFileDir = process.env.PRTLS_CONFIG_FILE

// Create a new configuration object
console.log(new Configuration(configFileDir))