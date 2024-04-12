<img src="https://raw.githubusercontent.com/ton-org/blueprint/main/logo.svg" width=400 >

# Blueprint

A development environment for TON blockchain for writing, testing, and deploying smart contracts.

### Quick start 🚀

Run the following in terminal to create a new project and follow the on-screen instructions:

```console
npm create ton@latest
```

&nbsp;

### Core features 🔥

* Create a development environment from template in one click - `npm create ton@latest`
* Streamlined workflow for building, testing and deploying smart contracts
* Dead simple deployment to mainnet/testnet using your favorite wallet (eg. Tonkeeper)
* Blazing fast testing of multiple smart contracts in an isolated blockchain running in-process

### Tech stack

1. Compiling FunC with https://github.com/ton-community/func-js (no CLI)
2. Testing smart contracts with https://github.com/ton-org/sandbox
3. Deploying smart contracts with [TON Connect 2](https://github.com/ton-connect), [Tonhub wallet](https://tonhub.com/) or a `ton://` deeplink

### Requirements

* [Node.js](https://nodejs.org) with a recent version like v18, verify version with `node -v`
* IDE with TypeScript and FunC support like [Visual Studio Code](https://code.visualstudio.com/) with the [FunC plugin](https://marketplace.visualstudio.com/items?itemName=tonwhales.func-vscode) or [IntelliJ Idea](https://www.jetbrains.com/idea/) with the [TON Development plugin](https://plugins.jetbrains.com/plugin/18541-ton-development)

&nbsp;

## Create a new project

1. Run and follow the on-screen instructions: &nbsp;  `npm create ton@latest` &nbsp; or &nbsp; `npx create-ton@latest`
2. (Optional) Then from the project directory: &nbsp; `npm install` &nbsp; or &nbsp; `yarn install`

### Directory structure

* `contracts/` - Source code in [FunC](https://ton.org/docs/develop/func/overview) for all smart contracts and their imports
* `wrappers/` - TypeScript interface classes for all contracts (implementing `Contract` from [@ton/core](https://www.npmjs.com/package/@ton/core))
  * include message [de]serialization primitives, getter wrappers and compilation functions
  * used by the test suite and client code to interact with the contracts from TypeScript
* `tests/` - TypeScript test suite for all contracts (relying on [Sandbox](https://github.com/ton-org/sandbox) for in-process tests)
* `scripts/` - Deployment scripts to mainnet/testnet and other scripts interacting with live contracts
* `build/` - Compilation artifacts created here after running a build command

### Build contracts

1. You need a compilation script in `wrappers/<CONTRACT>.compile.ts` - [example](/example/wrappers/Counter.compile.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint build` &nbsp; or &nbsp; `yarn blueprint build`
3. Non-interactive: &nbsp; `npx/yarn blueprint build <CONTRACT>` &nbsp; OR build all contracts &nbsp; `yarn blueprint build --all`
   * Example: `yarn blueprint build counter`
4. Build results are generated in `build/<CONTRACT>.compiled.json`

### Run the test suite

1. Run in terminal: &nbsp; `npx blueprint test` &nbsp; or &nbsp; `yarn blueprint test`
2. Alternative method: &nbsp; `npm test` &nbsp; or &nbsp; `yarn test`

> Learn more about writing tests from the Sandbox's documentation - [here](https://github.com/ton-org/sandbox#writing-tests).

### Deploy one of the contracts

1. You need a deploy script in `scripts/deploy<CONTRACT>.ts` - [example](/example/scripts/deployCounter.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint run` &nbsp; or &nbsp; `yarn blueprint run`
3. Non-interactive: &nbsp; `npx/yarn blueprint run <CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
   * Example: `yarn blueprint run deployCounter --mainnet --tonconnect`

### Help and additional commands

Run in terminal: &nbsp; `npx blueprint help` &nbsp; or &nbsp; `yarn blueprint help`

&nbsp;

## Develop a new contract

1. Make sure you have a project to host the contract
2. Run interactive: &nbsp;&nbsp; `npx blueprint create` &nbsp; or &nbsp; `yarn blueprint create`
3. Non-interactive: &nbsp; `npx/yarn blueprint create <CONTRACT> --type <TYPE>` (type can be `func-empty`, `func-counter`, `tact-empty`, `tact-counter`)
   * Example: `yarn blueprint create MyNewContract --type func-empty`

### Contract code

1. Implement the standalone FunC root contract in `contracts/<CONTRACT>.fc`
2. Implement shared FunC imports (if breaking code to multiple files) in `contracts/imports/*.fc`
3. Implement wrapper TypeScript class in `wrappers/<CONTRACT>.ts` to encode messages and decode getters

### Test suite

1. Implement TypeScript tests in `tests/<CONTRACT>.spec.ts`
2. Rely on the wrapper TypeScript class from `wrappers/<CONTRACT>.ts` to interact with the contract

> Learn more about writing tests from the Sandbox's documentation - [here](https://github.com/ton-org/sandbox#writing-tests).

### Compilation and deployment

1. Implement a compilation script in `wrappers/<CONTRACT>.compile.ts`
2. Implement a deployment script in `scripts/deploy<CONTRACT>.ts`
3. Rely on the wrapper TypeScript class from `wrappers/<CONTRACT>.ts` to initialize the contract

## Config

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

## Contributors

Special thanks to [@qdevstudio](https://t.me/qdevstudio) for their logo for blueprint.

## License

MIT

## Donations

TON - `EQAQR1d1Q4NaE5EefwUMdrr1QvXg-8mDB0XI2-fwDBD0nYxC`
