const PocketAAT = require("@pokt-network/aat-js").PocketAAT
const Pocket = require("@pokt-network/pocket-js").Pocket
const uuidv4 = require("uuid").v4
const typeGuard = require("@pokt-network/pocket-js").typeGuard
const RpcError = require("@pokt-network/pocket-js").RpcError
const PocketConfiguration = require("@pokt-network/pocket-js").Configuration
const Analytics = require("./analytics")
const getRandomFromArray = require("../utils").getRandomFromArray

class DispatchRelayer {
    constructor(configuration, logger) {
        this.configuration = configuration
        this.logger = logger
        this.clientPassphrase = uuidv4()
        this.applicationPassphrase = uuidv4()
        this.analytics = new Analytics(this.configuration, this.logger)
        this.pocketInstances = []
    }

    async submitRandomRelay(aats, pocket) {
        try {
            // First pick a random chain from the configuration
            const chain = getRandomFromArray(this.configuration.chains)
            // Now get a random AAT to use to submit the relay
            const aat = getRandomFromArray(aats[chain.hash])
            // Now pick a random payload from the chain
            const payload = getRandomFromArray(chain.payloads)
            // Send the relay
            let responseOrError = undefined
            // Set the configuration for pocket
            const session = await pocket.sessionManager.getCurrentSession(
                aat,
                payload.blockchain,
                pocket.configuration
            )
            if (typeGuard(session, RpcError)) {
                throw session
            }

            // Measure relay execution time
            const startTime = new Date()
            // Set the node
            let node = undefined
            if (payload.consensus_enabled === true) {
                //logger.debug(session)
                responseOrError = await pocket.sendConsensusRelay(
                    payload.data,
                    payload.blockchain,
                    aat,
                    pocket.configuration,
                    undefined,
                    payload.method,
                    payload.path,
                    undefined
                )
            } else {
                // Get the node to be able to log it before sending the relay
                const nodeOrError = session.getSessionNode()
                if (typeGuard(nodeOrError, Error)) {
                    responseOrError = nodeOrError
                } else {
                    node = nodeOrError
                    //console.log(node)
                    responseOrError = await pocket.sendRelay(
                        payload.data,
                        payload.blockchain,
                        aat,
                        pocket.configuration,
                        undefined,
                        payload.method,
                        payload.path,
                        node,
                        false
                    )
                }
            }
            // Measure relay execution time
            const endTime = new Date()
            const timeDiff = endTime - startTime //in ms
            const analytics = {
                success: false,
                errorMsg: undefined,
                relayTime: 0,
                node: undefined,
                session: session,
            }
            // Fill analytics
            analytics.relayTime = timeDiff
            if (node) {
                analytics.node = `${node.address}@${node.serviceURL.toString()}`
            }

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
        const dispatchURLList = []
        for (
            let index = 0;
            index < this.configuration.dispatchers.length;
            index++
        ) {
            dispatchURLList.push(new URL(this.configuration.dispatchers[index]))
        }
        this.logger.log(
            "debug",
            "Successfully parsed dispatch url list",
            dispatchURLList
        )

        // Create a keybase and a client account that will sign all relays
        const keybase = new Pocket(dispatchURLList).keybase
        const clientAccount = await keybase.createAccount(this.clientPassphrase)
        const clientPrivateKeyOrError = await keybase.exportAccount(
            clientAccount.addressHex,
            this.clientPassphrase
        )
        if (typeGuard(clientPrivateKeyOrError, Error)) {
            throw clientPrivateKeyOrError
        }
        const clientPrivateKey = clientPrivateKeyOrError
        // Load application AAT's
        this.aats = {}
        for (let index = 0; index < this.configuration.chains.length; index++) {
            const chainConfig = this.configuration.chains[index]
            this.aats[chainConfig.hash] = []
            for (
                let j = 0;
                j < chainConfig.application_private_keys.length;
                j++
            ) {
                const appPK = chainConfig.application_private_keys[j]
                // Create an application account so we can extract the public key
                const appAccount = await keybase.importAccount(
                    Buffer.from(appPK, "hex"),
                    this.applicationPassphrase
                )
                const pocketAAT = await PocketAAT.from(
                    "0.0.1",
                    clientAccount.publicKey.toString("hex"),
                    appAccount.publicKey.toString("hex"),
                    appPK
                )
                this.aats[chainConfig.hash].push(pocketAAT)
            }
        }
        // Log aats
        this.logger.log("debug", "Successfully configurated AATs", this.aats)

        for (
            let index = 0;
            index < this.configuration.parallelRelays;
            index++
        ) {
            const localPocketInstance = new Pocket(dispatchURLList)
            const account = await localPocketInstance.keybase.importAccount(
                clientPrivateKey,
                this.clientPassphrase
            )
            await localPocketInstance.keybase.unlockAccount(
                account.addressHex,
                this.clientPassphrase,
                0
            )
            this.pocketInstances.push(localPocketInstance)
        }
        // Log pocket instances
        this.logger.log(
            "debug",
            `Succesfully configured ${this.configuration.parallelRelays} pocket instances`
        )
    }

    // Start the relayer
    async start() {
        // Configure before starting
        await this.config()

        while (true) {
            const tasks = []
            for (
                let index = 0;
                index < this.configuration.parallelRelays;
                index++
            ) {
                const pocketConfiguration = new PocketConfiguration(
                    undefined,
                    undefined,
                    5,
                    this.configuration.relayTimeout,
                    true,
                    this.configuration.sessionBlockFrequency,
                    this.configuration.blockTime,
                    undefined
                )
                const pocket = this.pocketInstances[index]
                pocket.configuration = pocketConfiguration
                tasks.push(this.submitRandomRelay(this.aats, pocket))
            }
            const results = await Promise.all(tasks)
            this.analytics.logEntries(results)
        }
    }
}

module.exports = DispatchRelayer
