const fs = require('fs')
const {
    createLogger,
    format,
    transports
} = require('winston')

class Logger {
    constructor(configuration) {
        this.configuration = configuration
        this.logPath = `${this.configuration.dataDir}/logs`

        // Create the log directory for this instance if not exists
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, {
                recursive: true
            })
        }

        // Create transports list
        const logLevels = ["emerg", "alert", "crit", "error", "warning", "notice", "info", "debug"]
        const transportsList = []
        for (let index = 0; index < logLevels.length; index++) {
            const logLevel = logLevels[index]
            transportsList.push(
                new transports.File({
                    filename: `${this.logPath}/${logLevel}.log`,
                    level: logLevel
                })
            )
        }

        // Add console
        if (this.configuration.logsToConsole) {
            transportsList.push(new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            }))
        }

        this.logger = createLogger({
            level: this.configuration.logLevel,
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.errors({
                    stack: true
                }),
                format.splat(),
                format.json()
            ),
            defaultMeta: {
                service: 'prlts'
            },
            transports: transportsList
        })
    }

    log(level, message, ...args) {
        this.logger.log(level, message, args);
    }
}

module.exports = Logger