const typeGuard = require("@pokt-network/pocket-js").typeGuard
const RpcError = require("@pokt-network/pocket-js").RpcError
const Analytics = require("./analytics")
const getRandomFromArray = require("../utils").getRandomFromArray

class GatewayRelayer {
    constructor(configuration, logger) {
        this.configuration = configuration
        this.logger = logger
        this.analytics = new Analytics(this.configuration, this.logger)
    }

    async submitRandomRelay(aats) {
        try {
            // First pick a random chain from the configuration
            const chain = getRandomFromArray(this.configuration.chains)
            // Now get a random AAT to use to submit the relay
            const aat = getRandomFromArray(aats[chain.hash])
            // Now pick a random payload from the chain
            const payload = getRandomFromArray(chain.payloads)
            // Measure relay execution time
            const startTime = new Date();
            // Send the relay
            let responseOrError = undefined

            var request = require('request-promise')
            var requestURL = 'https://mainnet.gateway.pokt.network/v1/' + aat
            var options = {
                'method': 'POST',
                'url': requestURL,
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8","latest"]})
            }
            responseOrError = await request(options)

            // Measure relay execution time
            const endTime = new Date()
            const timeDiff = endTime - startTime; //in ms
            const analytics = {
                success: false,
                errorMsg: undefined,
                relayTime: 0,
                node: undefined,
                session: undefined
            }
            // Fill analytics
            analytics.relayTime = timeDiff

            // Parse the response or error and log it
            if (responseOrError === undefined || typeGuard(responseOrError, RpcError) || typeGuard(responseOrError, Error)) {
                analytics.errorMsg = responseOrError.message === undefined ? "Undefined response" : responseOrError.message
            } else {
                analytics.success = true
            }
            return analytics
        } catch (error) {
            this.logger.log("error", "Error submitting relay", error)
            if (typeof session !== 'undefined') {
                return {
                    success: false,
                    errorMsg: error.message,
                    relayTime: 0,
                    node: undefined,
                    session: session
                }
            } else {
                return {
                    success: false,
                    errorMsg: error.message,
                    relayTime: 0,
                    node: undefined,
                    session: undefined
                }
            }
        }
    }

    async config() {
        this.aats = {}
        for (let index = 0; index < this.configuration.chains.length; index++) {
            const chainConfig = this.configuration.chains[index];
            this.aats[chainConfig.hash] = []
            for (let j = 0; j < chainConfig.application_public_keys.length; j++) {
                const appPK = chainConfig.application_public_keys[j];
                this.aats[chainConfig.hash].push(appPK)
            }
        }
        // Log aats
        this.logger.log("debug", "Successfully configurated AATs", this.aats)
    }

    // Start the relayer
    async start() {
        // Configure before starting
        await this.config()

        while (true) {
            const tasks = []
            for (let index = 0; index < this.configuration.parallelRelays; index++) {
                tasks.push(this.submitRandomRelay(this.aats))
            }
            const results = await Promise.all(tasks)
            this.analytics.logEntries(results)
        }
    }
}

module.exports = GatewayRelayer