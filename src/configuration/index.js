const fs = require('fs')
const Validator = require('jsonschema').Validator
const ConfigurationFileValidator = new Validator()
const ChainListSchema = require("./chains-schema.json")
const ConfigurationSchema = require("./conf-schema.json")
const uuidv4 = require("uuid").v4

class Configuration {

    /**
     * Instantiates a new configuration from a configuration directory
     * @throws
     * @param {string} confDir 
     */
    constructor(confDir) {
        // Set default values
        this.confDir = confDir
        this.chains = []
        this.dataDir = ""
        this.logLevel = ""
        this.logsToConsole = false
        this.sessionBlockFrequency = 25
        this.blockTime = 60000
        this.relayTimeout = 10000
        this.parallelRelays = 10
        this.dispatchers = []
        this.gateway = ""

        // Validate configuration
        this.loadConfiguration(this.confDir)
    }

    /**
     * Validates the configuration in the confDir file
     * @throws
     * @param {string} confDir
     */
    loadConfiguration(confDir) {
        // Setup the confDir
        this.confDir = confDir
        
        // Validate the chains config
        const confRawStr = fs.readFileSync(this.confDir, "utf8")
        const confRawObj = JSON.parse(confRawStr)
        ConfigurationFileValidator.addSchema(ChainListSchema, "/ChainList")
        const validationResult = ConfigurationFileValidator.validate(confRawObj, ConfigurationSchema)
        if (validationResult.valid) {
            this.chains = confRawObj.chains
            this.sessionBlockFrequency = confRawObj.session_block_frequency
            this.blockTime = confRawObj.block_time
            this.relayTimeout = confRawObj.relay_timeout
            this.parallelRelays = confRawObj.parallel_relays
            this.dispatchers = confRawObj.dispatchers
            this.gateway = confRawObj.gateway
            this.logLevel = confRawObj.log_level
            this.logsToConsole = confRawObj.logs_to_console
            // Create a unique data dir within the specified data directory for this process
            this.dataDir = `${confRawObj.data_dir}/${uuidv4()}`

            // Create the data directory for this instance if not exists
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, {
                    recursive: true
                })
            }
        } else {
            var errorMsg = "Error validating configuration file, please follow schema\n"
            validationResult.errors.forEach(error => {
                errorMsg = errorMsg.concat(JSON.stringify(error) + "\n")             
            });
            throw new Error(errorMsg)
        }
    }
}

module.exports = Configuration