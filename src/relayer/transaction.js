const Pocket = require("@pokt-network/pocket-js").Pocket
const typeGuard = require("@pokt-network/pocket-js").typeGuard
const RpcError = require("@pokt-network/pocket-js").RpcError
const Analytics = require("./analytics")
const getRandomFromArray = require("../utils").getRandomFromArray
const HttpRpcProvider = require("@pokt-network/pocket-js").HttpRpcProvider
const publicKeyFromPrivate = require("@pokt-network/pocket-js").publicKeyFromPrivate
const addressFromPublickey = require("@pokt-network/pocket-js").addressFromPublickey

class TransactionRelayer {
    constructor(configuration, logger) {
        this.configuration = configuration
        this.logger = logger
        this.analytics = new Analytics(this.configuration, this.logger)
        this.pocketInstances = []
        this.dispatchURLList = []
        this.recipientsHex = []
        this.faucetPrivateKeyHex = this.configuration.faucetPK
        this.faucetPublicKeyHex = publicKeyFromPrivate(
            Buffer.from(this.faucetPrivateKeyHex, "hex")
        ).toString("hex")
        this.faucetAddressHex = addressFromPublickey(
            Buffer.from(this.faucetPublicKeyHex, "hex")
        ).toString("hex")
    }

    async submitRandomTX(pocket) {
        try {
            // Get a random RPC endpoint from dispatchers list
            const rpcEndpoint = getRandomFromArray(this.dispatchURLList)
            // Get a random recipient from list
            const recipientAddressHex = getRandomFromArray(this.recipientsHex)
            // Set the randomly chosen RPC
            pocket.rpc(new HttpRpcProvider(rpcEndpoint))

            // Measure relay execution time
            const startTime = new Date()

            // Send transaction
            const responseOrError = await pocket
                .withPrivateKey(this.faucetPrivateKeyHex)
                .send(this.faucetAddressHex, recipientAddressHex, "1")
                .submit(this.configuration.chainID, "100000")

            // Measure relay execution time
            const endTime = new Date()
            const timeDiff = endTime - startTime //in ms
            const analytics = {
                success: false,
                errorMsg: undefined,
                relayTime: 0,
                node: undefined,
                session: undefined,
            }
            // Fill analytics
            analytics.relayTime = timeDiff
            analytics.node = `${rpcEndpoint.toString()}`

            // Parse the response or error and log it
            if (
                responseOrError === undefined ||
                typeGuard(responseOrError, RpcError) ||
                typeGuard(responseOrError, Error)
            ) {
                analytics.errorMsg =
                    responseOrError.message === undefined
                        ? "Undefined response"
                        : responseOrError.message
            } else {
                analytics.success = true
            }
            return analytics
        } catch (error) {
            this.logger.log("error", "Error submitting relay", error)
            if (typeof session !== "undefined") {
                return {
                    success: false,
                    errorMsg: error.message,
                    relayTime: 0,
                    node: undefined,
                    session: session,
                }
            } else {
                return {
                    success: false,
                    errorMsg: error.message,
                    relayTime: 0,
                    node: undefined,
                    session: undefined,
                }
            }
        }
    }

    async config() {
        // Parse the dispatchers list
        for (
            let index = 0;
            index < this.configuration.dispatchers.length;
            index++
        ) {
            this.dispatchURLList.push(new URL(this.configuration.dispatchers[index]))
        }
        this.logger.log(
            "debug",
            "Successfully parsed dispatch url list",
            this.dispatchURLList
        )

        for (
            let index = 0;
            index < this.configuration.parallelRelays;
            index++
        ) {
            const localPocketInstance = new Pocket(this.dispatchURLList)
            // Create 1 recipient per pocket instance
            const recipientAccountOrError = await localPocketInstance.keybase.createAccount("doesnotmatter")
            if (typeGuard(recipientAccountOrError, Error)) {
                throw recipientAccountOrError
            }
            this.recipientsHex.push(recipientAccountOrError.addressHex)
            this.pocketInstances.push(localPocketInstance)
        }
        // Log pocket instances
        this.logger.log(
            "debug",
            `Succesfully configured ${this.configuration.parallelRelays} pocket instances`
        )
    }

    async launchTasks(self) {
        const tasks = []
        for (
            let index = 0;
            index < self.configuration.parallelRelays;
            index++
        ) {
            const pocket = self.pocketInstances[index]
            tasks.push(self.submitRandomTX(pocket))
        }
        const results = await Promise.all(tasks)
        self.analytics.logEntries(results)
        // Wait a random amount of time
        // setTimeout(self.launchTasks, 10000, self)
    }

    // Start the relayer
    async start() {
        // Configure before starting
        await this.config()

        setTimeout(this.launchTasks, 1000, this)
    }
}

module.exports = TransactionRelayer
