<div align="center">
  <a href="https://www.pokt.network">
    <img src="https://user-images.githubusercontent.com/16605170/74199287-94f17680-4c18-11ea-9de2-b094fab91431.png" alt="Pocket Network logo" width="340"/>
  </a>
</div>

# Pocket Relay Load Testing System (PRLTS)

Tool to stress test the Pocket Network by sending random pre-configured relays.

<div>
  <a href="https://golang.org"><img  src="https://img.shields.io/badge/node-v12-red.svg"/></a>
</div>

## Overview
<div>
    <a  href="https://github.com/pokt-network/prlts/releases"><img src="https://img.shields.io/github/release-pre/pokt-network/prlts.svg"/></a>
    <a  href="https://github.com/pokt-network/prlts/pulse"><img src="https://img.shields.io/github/contributors/pokt-network/prlts.svg"/></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg"/></a>
    <a href="https://github.com/pokt-network/prlts/pulse"><img src="https://img.shields.io/github/last-commit/pokt-network/prlts.svg"/></a>
    <a href="https://github.com/pokt-network/prlts/pulls"><img src="https://img.shields.io/github/issues-pr/pokt-network/prlts.svg"/></a>
    <a href="https://github.com/pokt-network/prlts/releases"><img src="https://img.shields.io/badge/platform-linux%20%7C%20windows%20%7C%20macos-pink.svg"/></a>
    <a href="https://github.com/pokt-network/prlts/issues"><img src="https://img.shields.io/github/issues-closed/pokt-network/prlts.svg"/></a>
</div>

## Pre-requisites

1. NodeJS v12^

## Installation

Clone the repository wherever you want:

```
git clone https://github.com/pokt-network/prlts.git
```

Install dependencies

```
npm install
```

## Configuring PRLTS

### Configuration file location

#### Configuring via environment variable

```
export PRLTS_CONFIG_FILE=<your path to config>/config.json
```

#### Configuring via .env file

You can create a .env file to specify the location of your configuration file:

```
PRLTS_CONFIG_FILE=<your path to config>/config.json
```

### Configuration file example:

```json
{
    "chains": [{
        // Chain ID: https://docs.pokt.network/docs/supported-networks
        "hash": "0021",
        // Private keys for applications that are staked for this chain
        "application_private_keys": [],
        // Payloads compatible with this chain
        "payloads": [{
            "data": "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"0xF02c1c8e6114b1Dbe8937a39260b5b0a374432bB\", \"latest\"],\"id\":1}",
            "blockchain": "0021",
            "consensus_enabled": false
        }]
    }],
    // How many blocks are in a session in the network you're connecting to
    "session_block_frequency": 25,
    // The current blocktime in MS
    "block_time": 60000,
    // A timeout for relays, can be 0
    "relay_timeout": 10000,
    // How many relays in parrallel you want to submit per round
    "parallel_relays": 10,
    // A list of Dispatchers
    "dispatchers": [
        "http://node1.testnet.pokt.network:8081",
        "http://node2.testnet.pokt.network:8081",
        "http://node3.testnet.pokt.network:8081",
        "http://node4.testnet.pokt.network:8081",
        "http://node5.testnet.pokt.network:8081",
        "http://node6.testnet.pokt.network:8081",
        "http://node7.testnet.pokt.network:8081",
        "http://node8.testnet.pokt.network:8081",
        "http://node9.testnet.pokt.network:8081",
        "http://node10.testnet.pokt.network:8081"
    ],
    // The directory to which you wanna output logs and analytics dta
    "data_dir": "/Users/luyzdeleon/current_projects/prlts/data",
    // The log level
    "log_level": "debug",
    // Whether or not to log to output to the console
    "logs_to_console": true
}
```

## Running PRLTS

To run PRLTS all you have to do is:

```
cd prlts
node src/index.js
```

## Contributing

Please read [CONTRIBUTING.md](https://github.com/pokt-network/repo-template/blob/master/CONTRIBUTING.md) for details on contributions and the process of submitting pull requests.

## Support & Contact

<div>
  <a  href="https://twitter.com/poktnetwork" ><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"></a>
  <a href="https://t.me/POKTnetwork"><img src="https://img.shields.io/badge/Telegram-blue.svg"></a>
  <a href="https://www.facebook.com/POKTnetwork" ><img src="https://img.shields.io/badge/Facebook-red.svg"></a>
  <a href="https://research.pokt.network"><img src="https://img.shields.io/discourse/https/research.pokt.network/posts.svg"></a>
</div>


## License

This project is licensed under the MIT License; see the [LICENSE.md](LICENSE.md) file for details.
