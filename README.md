<img src="https://raw.githubusercontent.com/ton-org/blueprint/main/logo.svg" width=400 >

# Blueprint

A development environment for TON blockchain for writing, testing, and deploying smart contracts.

## Table of Contents

* [Quick start](#quick-start-)
* [Overview](#overview)
  * [Core features](#core-features)
  * [Tech stack](#tech-stack)
  * [Requirements](#requirements)
* [Features overview](#features-overview)
  * [Project creation](#project-creation)
  * [Directory structure](#directory-structure)
  * [Building contracts](#building-contracts)
  * [Running the test suites](#running-the-test-suites)
  * [Running scripts](#running-scripts)
    * [Deploying contracts](#deploying-contracts)
    * [Using Mnemonic Provider](#using-mnemonic-provider)
* [Contract development](#contract-development)
  * [Creating contracts](#creating-contracts)
  * [Writing contract code](#writing-contract-code)
  * [Testing contracts](#testing-contracts)
  * [Benchmark contracts](#benchmark-contracts)
* [Configuration](#configuration)
  * [Plugins](#plugins)
  * [Custom network](#custom-network)
* [Contributors](#contributors)
* [License](#license)
* [Donations](#donations)

## Quick start 🚀

Run the command in terminal to create a new project and follow the on-screen instructions:

```console
npm create ton@latest
```

## Overview

Blueprint is an all-in-one development environment designed to enhance the process of creating, testing, and deploying smart contracts on TON blockchain using [FunC](https://docs.ton.org/develop/func/overview), [Tolk](https://docs.ton.org/develop/tolk/overview), and [Tact](https://docs.tact-lang.org/) languages.

### Core features

* Create a development environment from template - `npm create ton@latest`
* Streamlined workflow for building, testing and deploying smart contracts
* Dead simple deployment to mainnet/testnet using your favorite wallet (eg. Tonkeeper)
* Blazing fast testing of multiple smart contracts in an isolated blockchain running in-process

### Tech stack

1. Compiling FunC with https://github.com/ton-community/func-js
2. Compiling Tolk with https://github.com/ton-blockchain/tolk-js
3. Compiling Tact with https://github.com/tact-lang/tact
4. Testing smart contracts with https://github.com/ton-org/sandbox
5. Deploying smart contracts with [TON Connect 2](https://github.com/ton-connect) or a `ton://` deeplink

### Requirements

* [Node.js](https://nodejs.org) with a recent version like v18. Version can be verified with `node -v`
* IDE with TON support:
  * [Visual Studio Code](https://code.visualstudio.com/) with the [FunC plugin](https://marketplace.visualstudio.com/items?itemName=tonwhales.func-vscode), [Tolk plugin](https://marketplace.visualstudio.com/items?itemName=ton-core.tolk-vscode) or [Tact plugin](https://marketplace.visualstudio.com/items?itemName=tonstudio.vscode-tact)
  * [IntelliJ IDEA](https://www.jetbrains.com/idea/) with the [TON Development plugin](https://plugins.jetbrains.com/plugin/23382-ton)

## Features overview

### Project creation

1. Run and follow the on-screen instructions: &nbsp; `npm create ton@latest` &nbsp; or &nbsp; `npx create-ton@latest`
2. From the project directory run &nbsp; `npm/yarn install` &nbsp; to install dependencies

### Directory structure

* `contracts/` - Source code for all smart contracts and their imports
* `wrappers/` - TypeScript interface classes for all contracts (implementing `Contract` from [@ton/core](https://www.npmjs.com/package/@ton/core))
  * include message [de]serialization primitives, getter wrappers and compilation functions
  * used by the test suite and client code to interact with the contracts from TypeScript
* `compilables/` - Compilations scripts for contracts
* `tests/` - TypeScript test suite for all contracts (relying on [Sandbox](https://github.com/ton-org/sandbox) for in-process tests)
* `scripts/` - Deployment scripts to mainnet/testnet and other scripts interacting with live contracts
* `build/` - Compilation artifacts created here after running a build command

### Building contracts

1. You need a compilation script in `compilables/<CONTRACT>.compile.ts` - [example](/example/compilables/Counter.compile.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint build` &nbsp; or &nbsp; `yarn blueprint build`
3. Non-interactive: &nbsp; `npx/yarn blueprint build <CONTRACT>` &nbsp; OR build all contracts &nbsp; `yarn blueprint build --all`
   * Example: `yarn blueprint build counter`
4. Build results are generated in `build/<CONTRACT>.compiled.json`
5. Tact generated files are located in `build/<CONTRACT>` directory
6. Fift output is located in `build/<CONTRACT>/<CONTRACT>.fif`

### Running the test suites

1. Run in terminal: &nbsp; `npx blueprint test` &nbsp; or &nbsp; `yarn blueprint test`
2. Alternative method: &nbsp; `npm test` &nbsp; or &nbsp; `yarn test`
3. You can specify test file to run:  &nbsp; `npm/yarn test <CONTRACT>`
    * Example: `yarn test counter`

> Learn more about writing tests from the Sandbox's documentation - [here](https://github.com/ton-org/sandbox#writing-tests).

### Running scripts

1. Custom scripts should be located in `scripts` folder
2. Script file must have exported function `run`
```ts
export async function run(provider: NetworkProvider, args: string[]) {
  // 
}
```
3. Script can be run using `npx/yarn blueprint run <SCRIPT> [arg1, arg2, ...]` command

#### Deploying contracts

1. You need a deployment script in `scripts/deploy<CONTRACT>.ts` - [example](/example/scripts/deployCounter.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint run` &nbsp; or &nbsp; `yarn blueprint run`
3. Non-interactive: &nbsp; `npx/yarn blueprint run deploy<CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
  * Example: `yarn blueprint run deployCounter --mainnet --tonconnect`

#### Using Mnemonic Provider

To run scripts using a wallet by mnemonic authentication, you need to configure your environment and use the `Mnemonic` option when running scripts.

Start by adding the following environment variables to your `.env` file:
* **`WALLET_MNEMONIC`**: Your wallet's mnemonic phrase (space-separated words).
* **`WALLET_VERSION`**: The wallet contract version to use. Supported versions: `v1r1`, `v1r2`, `v1r3`, `v2r1`, `v2r2`, `v3r1`, `v3r2`, `v4r1`, `v4r2` (or `v4`), `v5r1`.

**Optional variables:**
* **`WALLET_ID`**: The wallet ID (can be used with versions below `v5r1`).
* **`SUBWALLET_NUMBER`**: The subwallet number used to build the wallet ID (can be used with `v5r1` wallets).

Once your environment is set up, you can use the mnemonic wallet for deployment with the appropriate configuration.

#### Deploying contracts

1. You need a deployment script in `scripts/deploy<CONTRACT>.ts` - [example](/example/scripts/deployCounter.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint run` &nbsp; or &nbsp; `yarn blueprint run`
3. Non-interactive: &nbsp; `npx/yarn blueprint run deploy<CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
  * Example: `yarn blueprint run deployCounter --mainnet --tonconnect`

#### Using Mnemonic Provider

To run scripts using a wallet by mnemonic authentication, you need to configure your environment and use the `Mnemonic` option when running scripts.

Start by adding the following environment variables to your `.env` file:
* **`WALLET_MNEMONIC`**: Your wallet's mnemonic phrase (space-separated words).
* **`WALLET_VERSION`**: The wallet contract version to use. Supported versions: `v1r1`, `v1r2`, `v1r3`, `v2r1`, `v2r2`, `v3r1`, `v3r2`, `v4`, `v5r1`.

**Optional variables:**
* **`WALLET_ID`**: The wallet ID (required for versions below `v5r1`).
* **`SUBWALLET_NUMBER`**: The subwallet number used to build the wallet ID (required for `v5r1` wallets).

Once your environment is set up, you can use the mnemonic wallet for deployment with the appropriate configuration.

### Updating FunC version

FunC version can be updated using `npx/yarn blueprint set func` command

### Updating Tact version

Tact version can be updated to the latest using `npm update/yarn upgrade @tact-lang/compiler` command

### Help and additional commands

Run in terminal: &nbsp; `npx blueprint help` &nbsp; or &nbsp; `yarn blueprint help`

## Contract development

Before developing, make sure that your current working directory is located in the root of the project created using `npm create ton@latest`

### Creating contracts

1. Run interactive: &nbsp;&nbsp; `npx blueprint create` &nbsp; or &nbsp; `yarn blueprint create`
2. Non-interactive: &nbsp; `npx/yarn blueprint create <CONTRACT> --type <TYPE>` (type can be `func-empty`, `tolk-empty`, `tact-empty`, `func-counter`, `tolk-counter`, `tact-counter`)
   * Example: `yarn blueprint create MyNewContract --type func-empty`

### Renaming contracts

1. Run interactive: &nbsp;&nbsp; `npx blueprint rename` &nbsp; or &nbsp; `yarn blueprint rename`
2. Non-interactive: &nbsp; `npx/yarn blueprint rename <OLD_NAME> <NEW_NAME>`
  * Example: `yarn blueprint rename OldContract NewContract `

### Writing contract code

#### FunC
1. Implement the standalone FunC root contract in `contracts/<CONTRACT>.fc`
2. Implement shared FunC imports (if breaking code to multiple files) in `contracts/imports/*.fc`
3. Implement wrapper TypeScript class in `wrappers/<CONTRACT>.ts` to encode messages and decode getters

#### Tolk
1. Implement the contract in `contracts/<CONTRACT>.tolk`; if you wish, split into multiple files
2. Implement wrapper TypeScript class in `wrappers/<CONTRACT>.ts` to encode messages and decode getters

#### Tact
1. Implement the contract in `contracts/<CONTRACT>.tact`
2. Wrappers will be automatically generated in `build/<CONTRACT>/tact_<CONTRACT>.ts`

### Testing contracts

1. Implement TypeScript tests in `tests/<CONTRACT>.spec.ts`
2. Rely on the wrapper TypeScript class from `wrappers/<CONTRACT>.ts` to interact with the contract

> Learn more about writing tests from the Sandbox's documentation - [here](https://github.com/ton-org/sandbox#writing-tests).

### Publishing Wrapper Code

1. **Authenticate with npm**
Run `npm adduser` to log in to your npm account.
> 📝 **Note:** You can learn more about advanced authentication in the official npm docs:
> [npmrc – Auth-Related Configuration](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc#auth-related-configuration)

2. **Update the package version**
Edit the `version` field in your `package.json` to reflect the new release (e.g., `1.0.1` → `1.0.2`).

3. **Build the package**
Run the following command to generate and bundle your contract wrappers:

```bash
blueprint pack
```

4. **Publish to npm**
Push the package to the public npm registry:

```bash
npm publish --access public
```

### Benchmark contracts

1. Run `npx blueprint snapshot [--label=<comment>|-l <comment>]` to collect metrics of contracts and save snapshot
2. Run `npx blueprint test --gas-report|-g` to compare current metrics and saved snapshot

> Learn more about collect metric from the Sandbox's documentation - [here](https://github.com/ton-org/sandbox#benchmark-contracts).

## Configuration

A config may be created in order to control some of blueprint's features. If a config is needed, create a `blueprint.config.ts` file in the root of your project with something like this:
```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    // config contents
};
```
It is important that the config is exported, is named `config`, and is not `default` exported.

Config's features are explained below.

### Plugins

Blueprint has a plugin system to allow the community to develop their own additions for the ecosystem without the need to change blueprint's code.

In order to use plugins, add a `plugins` array to your config:
```typescript
import { Config } from '@ton/blueprint';
import { ScaffoldPlugin } from 'blueprint-scaffold';

export const config: Config = {
    plugins: [new ScaffoldPlugin()],
};
```
(This example shows how to add the [scaffold](https://github.com/1IxI1/blueprint-scaffold) plugin)

Here are some of the plugins developed by the community:
- [scaffold](https://github.com/1IxI1/blueprint-scaffold) - allows developers to quickly create a simple dapp automatically using the wrappers' code
- [misti](https://github.com/nowarp/blueprint-misti) - simplifies workflow with the [Misti](https://nowarp.github.io/tools/misti/) static analyzer

### Custom network

A custom network may be specified by using the `--custom` flags, which you can read about by running `blueprint help run`, but it can be tiresome to use these at all times. Instead, to specify a custom network to always be used (unless `--custom` flags are present), add a `network` object to your config:
```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        type: 'mainnet',
        version: 'v2',
        key: 'YOUR_API_KEY',
    },
};
```

The above config parameters are equivalent to the arguments in the following command:
```bash
npx blueprint run --custom https://toncenter.com/api/v2/jsonRPC --custom-version v2 --custom-type mainnet --custom-key YOUR_API_KEY
```

Properties of the `network` object have the same semantics as the `--custom` flags with respective names (see `blueprint help run`).

### Liteclient Support

Lite client is supported through the following configuration:

```ts
import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'https://ton.org/testnet-global.config.json', // Use https://ton.org/global.config.json for mainnet or any custom configuration
        version: 'liteclient',
        type: 'testnet',
    }
};
```

You can also provide these parameters via CLI:

```bash
npx blueprint run \
  --custom https://ton.org/testnet-global.config.json \
  --custom-version liteclient \
  --custom-type testnet
```

#### Contract Verification Using Custom Network

You can also use custom network to verify contracts, like so:
```bash
npx blueprint verify --custom https://toncenter.com/api/v2/jsonRPC --custom-version v2 --custom-type mainnet --custom-key YOUR_API_KEY
```
(or similarly using the config), however custom type MUST be specified as either `mainnet` or `testnet` when verifying.

### Request timeout

You can optionally configure how long HTTP requests should wait before timing out using the `requestTimout` field. This can be especially useful when working with unstable or slow networks.

```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    requestTimeout: 10000, // 10 seconds
};
```

Here is the updated documentation with explanations for the `recursiveWrappers` and `manifestUrl` fields included:

---

### Custom network

A custom network may be specified by using the `--custom` flags, which you can read about by running `blueprint help run`, but it can be tiresome to use these at all times. Instead, to specify a custom network to always be used (unless `--custom` flags are present), add a `network` object to your config:

```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    network: {
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        type: 'mainnet',
        version: 'v2',
        key: 'YOUR_API_KEY',
    },
};
```

The above config parameters are equivalent to the arguments in the following command:

```bash
npx blueprint run --custom https://toncenter.com/api/v2/jsonRPC --custom-version v2 --custom-type mainnet --custom-key YOUR_API_KEY
```

Properties of the `network` object have the same semantics as the `--custom` flags with respective names (see `blueprint help run`).

You can also use custom network to verify contracts, like so:

```bash
npx blueprint verify --custom https://toncenter.com/api/v2/jsonRPC --custom-version v2 --custom-type mainnet --custom-key YOUR_API_KEY
```

(or similarly using the config), however custom type MUST be specified as either `mainnet` or `testnet` when verifying.

### Request timeout

You can optionally configure how long HTTP requests should wait before timing out using the `requestTimeout` field. This can be especially useful when working with unstable or slow networks.

```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    requestTimeout: 10000, // 10 seconds
};
```

### Recursive wrappers

You can configure whether the `wrappers` or `compilables` directories should be searched recursively for contracts configs by setting the `recursiveWrappers` field.

```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    recursiveWrappers: true,
};
```

By default, this is set to `false`.

### TonConnect manifest URL

If you're using a TonConnect provider, you can override the default manifest URL by specifying the `manifestUrl` field.
```typescript
import { Config } from '@ton/blueprint';

export const config: Config = {
    manifestUrl: 'https://yourdomain.com/custom-manifest.json',
};
```

By default, the manifest URL is set to:
```
https://raw.githubusercontent.com/ton-org/blueprint/main/tonconnect/manifest.json
```

## Contributors

Special thanks to [@qdevstudio](https://t.me/qdevstudio) for their logo for blueprint.

## License

MIT

## Donations

TON - `EQAQR1d1Q4NaE5EefwUMdrr1QvXg-8mDB0XI2-fwDBD0nYxC`
