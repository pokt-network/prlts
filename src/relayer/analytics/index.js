const fs = require("fs")

class Analytics {
    constructor(configuration, logger) {
        this.configuration = configuration
        this.logger = logger
        this.analyticsDir = `${this.configuration.dataDir}/analytics`
        this.entries = []

        // Create the analytics directory for this instance if not exists
        if (!fs.existsSync(this.analyticsDir)) {
            fs.mkdirSync(this.analyticsDir, {
                recursive: true,
            })
        }

        // Set defaults
        this.data = {
            total: 0,
            success: 0,
            error: 0,
            avgRelayTime: 0,
            errorsCount: {},
            nodeErrorReports: {},
            nodeSuccesfulRelaysCount: {},
            sessionsCount: {},
        }
    }

    logEntries(entries) {
        this.logger.log("debug", "Digesting entries", entries)
        for (let index = 0; index < entries.length; index++) {
            const entry = entries[index]
            this.logEntry(entry)
        }
        this.save()
    }

    logEntry(entry) {
        // Increase the entry count
        this.entries.push(entry)

        // Increase the total
        this.data.total = this.data.total + 1

        // Counts of entries per session
        const session = entry.session
        if (
            typeof session !== "undefined" &&
            typeof session.sessionHeader !== "undefined"
        ) {
            const key = session.sessionHeader.applicationPubKey
            let prevSessionCount =
                this.data.sessionsCount[key] !== undefined
                    ? this.data.sessionsCount[key]
                    : 0
            this.data.sessionsCount[key] = prevSessionCount + 1
            let sessionNodesStr = ""
            for (let j = 0; j < session.sessionNodes.length; j++) {
                const node = session.sessionNodes[j]
                sessionNodesStr = sessionNodesStr.concat(
                    `${node.address}@${node.serviceURL.toString()}\n`
                )
            }
        }

        // Increase the global avg relay time
        if (entry.relayTime > 0) {
            this.data.avgRelayTime =
                this.data.avgRelayTime +
                ((entry.relayTime - this.data.avgRelayTime) / this.data.total)
        }

        // Increase success/error
        if (entry.success) {
            // Increase total succesful relays
            this.data.success = this.data.success + 1

            // Increase successful relays per node count
            if (entry.node) {
                let prevSuccessCount = this.data.nodeSuccesfulRelaysCount[
                    entry.node
                ]
                if (prevSuccessCount === undefined) {
                    prevSuccessCount = 0
                }
                this.data.nodeSuccesfulRelaysCount[entry.node] =
                    prevSuccessCount + 1
            }
        } else {
            // Increase total of error relays
            this.data.error = this.data.error + 1

            // Log global error counts
            if (entry.errorMsg) {
                let prevErrorCount = this.data.errorsCount[entry.errorMsg]
                if (prevErrorCount === undefined) {
                    prevErrorCount = 0
                }
                this.data.errorsCount[entry.errorMsg] = prevErrorCount + 1
            }

            if (entry.node) {
                // Increase the global errors per node count
                let nodeErrorReport = this.data.nodeErrorReports[entry.node]
                if (!nodeErrorReport) {
                    nodeErrorReport = {}
                }

                // Increase counts based on error message
                let prevNodeErrorCount = nodeErrorReport[entry.errorMsg]
                if (prevNodeErrorCount === undefined) {
                    prevNodeErrorCount = 0
                }
                nodeErrorReport[entry.errorMsg] = prevNodeErrorCount + 1
                this.data.nodeErrorReports[entry.node] = nodeErrorReport
            }
        }
    }

    save() {
        try {
            fs.writeFileSync(
                `${this.analyticsDir}/data.json`,
                JSON.stringify(this.data)
            )
            this.logger.log("debug", "Updated analytics with data", this.data)
        } catch (err) {
            this.logger.log("error", "Error saving analytics data", err)
        }
    }
}

module.exports = Analytics
