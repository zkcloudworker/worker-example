# Worker example

A simple example of a worker running a ZkProgram.

## Installation

You need to install `node (v20+)` and `git` and clone this repo

```
git clone https://github.com/zkcloudworker/worker-example
cd worker-example
```

## Deploy

Install zkCloudWorker CLI tool

```sh
npm install -g zkcloudworker-cli
```

Deploy this repo to the zkCloudWorker cloud

```sh
zkcw deploy
```

or, in verbose mode

```sh
zkcw deploy -v
```

## Run

Run:

```sh
yarn test
```

### Lightnet

```sh
zk lightnet start
zk lightnet explorer
yarn lightnet.deploy
yarn lightnet.run
```

### Zeko

Faucet: https://zeko.io/faucet
Explorer: https://zekoscan.io/devnet/home
