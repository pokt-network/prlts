const fs = require('fs')
const Validator = require('jsonschema').Validator
const ConfigurationFileValidator = new Validator()
const ChainListSchema = require("./chains-schema.json")
const ConfigurationSchema = require("./conf-schema.json")

class Configuration {

    /**
     * Instantiates a new configuration from a configuration directory
     * @throws
     * @param {string} confDir 
     */
    constructor(confDir, logger) {
        // Set default values
        this.confDir = confDir
        this.chains = []
        this.logsDir = "prlts.log"
        this.sessionBlockFrequency = 25
        this.blockTime = 60000
        this.relayTimeout = 10000
        this.parallelRelays = 10
        this.dispatchers = []

        // Set the logger
        this.logger = logger

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
        this.logger.debug("Configuration directory", confDir)
        this.logger.debug("Configuration content", confRawStr)
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
            if (confRawObj.logs_dir) {
                this.logsDir = confRawObj.logs_dir
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