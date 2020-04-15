const PocketAAT = require("@pokt-network/aat-js").PocketAAT
const Pocket = require("@pokt-network/pocket-js").Pocket
const uuidv4 = require("uuid").v4
const Configuration = require("./configuration")
const typeGuard = require("@pokt-network/pocket-js").typeGuard
const RpcError = require("@pokt-network/pocket-js").RpcError
const PocketConfiguration = require("@pokt-network/pocket-js").Configuration

async function submitRandomRelay(configuration, aats, pocket) {
    try {
        // First pick a random chain from the configuration
        const chain = getRandomFromArray(configuration.chains)
        // Now get a random AAT to use to submit the relay
        const aat = getRandomFromArray(aats[chain.hash])
        // Now pick a random payload from the chain
        const payload = getRandomFromArray(chain.payloads)
        // Measure relay execution time
        const startTime = new Date();
        // Send the relay
        const responseOrError = await pocket.sendRelay(
            payload.data,
            payload.blockchain,
            aat,
            new PocketConfiguration(undefined, undefined, undefined, configuration.relayTimeout, undefined, configuration.sessionBlockFrequency, configuration.blockTime),
            undefined,
            payload.method,
            payload.path,
            undefined,
            payload.consensus_enabled)
        // Measure relay execution time
        const endTime = new Date()
        const timeDiff = endTime - startTime; //in ms
        const analytics = {
            success: false,
            errorMsg: undefined,
            relayTime: 0
        }
        // Fill analytics
        analytics.relayTime = timeDiff

        // Parse the response or error and log it
        if (typeGuard(responseOrError, RpcError)) {
            //console.error(responseOrError)
            //analytics.error = analytics.error + 1
            analytics.errorMsg = responseOrError.message
        } else {
            //console.log(responseOrError)
            analytics.success = true
        }
        console.log(responseOrError)
        return analytics
    } catch (error) {
        return {
            success: false,
            errorMsg: error.message,
            relayTime: 0
        }
    }
}

function getRandomFromArray(array) {
    return array[Math.random() * array.length >> 0]
}

class Server {
    constructor(confDir) {
        this.configuration = new Configuration(confDir)
        this.clientPassphrase = uuidv4()
        this.applicationPassphrase = uuidv4()
    }

    async start() {
        const dispatchURLList = []
        for (let index = 0; index < this.configuration.dispatchers.length; index++) {
            dispatchURLList.push(new URL(this.configuration.dispatchers[index]))
        }
        const pocket = new Pocket(dispatchURLList)
        // Create a client account that will sign all relays
        const clientAccount = await pocket.keybase.createAccount(this.clientPassphrase)
        const clientPrivateKeyOrError = await pocket.keybase.exportAccount(clientAccount.addressHex, this.clientPassphrase)
        if (typeGuard(clientPrivateKeyOrError, Error)) {
            throw clientPrivateKeyOrError
        }
        const clientPrivateKey = clientPrivateKeyOrError
        // Load application AAT's
        this.aats = {}
        for (let index = 0; index < this.configuration.chains.length; index++) {
            const chainConfig = this.configuration.chains[index];
            this.aats[chainConfig.hash] = []
            for (let j = 0; j < chainConfig.application_private_keys.length; j++) {
                const appPK = chainConfig.application_private_keys[j];
                // Create an application account so we can extract the public key
                const appAccount = await pocket.keybase.importAccount(Buffer.from(appPK, "hex"), this.applicationPassphrase)
                const pocketAAT = await PocketAAT.from(
                    "0.0.1",
                    clientAccount.publicKey.toString("hex"),
                    appAccount.publicKey.toString("hex"),
                    appPK
                )
                this.aats[chainConfig.hash].push(pocketAAT)
            }
        }

        const globalAnalytics = {
            total: 0,
            success: 0,
            error: 0,
            avgRelayTime: 0,
            errorsCount: {}
        }

        while (true) {
            const tasks = []
            for (let index = 0; index < this.configuration.parallelRelays; index++) {
                const localPocketInstance = new Pocket(dispatchURLList)
                const account = await localPocketInstance.keybase.importAccount(clientPrivateKey, this.clientPassphrase)
                await localPocketInstance.keybase.unlockAccount(account.addressHex, this.clientPassphrase, 0)
                tasks.push(submitRandomRelay(this.configuration, this.aats, localPocketInstance))
            }
            const results = await Promise.all(tasks)
            for (let index = 0; index < results.length; index++) {
                const result = results[index]
                // Increase the total
                globalAnalytics.total = globalAnalytics.total + 1

                // Increase the global avg relay time
                if (result.relayTime > 0) {
                    globalAnalytics.avgRelayTime = globalAnalytics.avgRelayTime + ((result.relayTime - globalAnalytics.avgRelayTime) / globalAnalytics.total)
                }

                // Increase success/error
                if (result.success) {
                    globalAnalytics.success = globalAnalytics.success + 1
                } else {
                    globalAnalytics.error = globalAnalytics.error + 1
                    // Increase individual error counts
                    if (result.errorMsg) {
                        let prevErrorCount = globalAnalytics.errorsCount[result.errorMsg]
                        if (prevErrorCount === undefined) {
                            prevErrorCount = 0
                        }
                        globalAnalytics.errorsCount[result.errorMsg] = prevErrorCount + 1
                    }
                }
            }
            console.log("GLOBAL ANALYTICS REPORT")
            console.log(globalAnalytics)
        }
    }
}

module.exports = Server