const pino = require('pino');
const childProcess = require('child_process');
const stream = require('stream');
const fs = require('fs')
const pinoms = require('pino-multi-stream')
const uuidv4 = require("uuid").v4

class Logger {
    constructor(logLevel) {
        // Environment variables
        const cwd = process.cwd();
        const logPath = `${cwd}/log/${uuidv4()}`;

        // Create the log directory for this instance if not exists
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
        }

        // Create a stream where the logs will be written
        var streams = [{
                level: 'debug',
                stream: fs.createWriteStream(`${logPath}/debug.stream.out`)
            },
            {
                level: 'info',
                stream: fs.createWriteStream(`${logPath}/info.stream.out`)
            }, {
                level: 'error',
                stream: fs.createWriteStream(`${logPath}/error.stream.out`)
            },
            {
                level: 'fatal',
                stream: fs.createWriteStream(`${logPath}/fatal.stream.out`)
            }
        ]
        this.log = pinoms({
            name: 'prlts',
            prettyPrint: false,
            level: logLevel,
            streams: streams
        });
    }

    debug(msg, ...args) {
        this.log.child({
            args: args
        }).debug(msg)
    }

    info(msg, ...args) {
        this.log.child({
            args: args
        }).info(msg)
    }

    error(msg, ...args) {
        this.log.child({
            args: args
        }).error(msg)
    }

    fatal(msg, ...args) {
        this.log.child({
            args: args
        }).fatal(msg)
    }
}

module.exports = Logger