<img src="https://raw.githubusercontent.com/ton-community/blueprint/main/logo.svg" width=400 >

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
2. Testing smart contracts with https://github.com/ton-community/sandbox
3. Deploying smart contracts with [TON Connect 2](https://github.com/ton-connect), [Tonhub wallet](https://tonhub.com/) or a `ton://` deeplink

### Requirements

* [Node.js](https://nodejs.org) with a recent version like v18, verify version with `node -v`
* IDE with TypeScript and FunC support like [Visual Studio Code](https://code.visualstudio.com/) with the [FunC plugin](https://marketplace.visualstudio.com/items?itemName=tonwhales.func-vscode)

&nbsp;

## Create a new project

1. Run and follow the on-screen instructions: &nbsp;  `npm create ton@latest` &nbsp; or &nbsp; `npx create-ton@latest`
2. (Optional) Then from the project directory: &nbsp; `npm install` &nbsp; or &nbsp; `yarn install`

### Directory structure

* `contracts/` - Source code in [FunC](https://ton.org/docs/develop/func/overview) for all smart contracts and their imports
* `wrappers/` - TypeScript interface classes for all contracts (implementing `Contract` from [ton-core](https://www.npmjs.com/package/ton-core))
  * include message [de]serialization primitives, getter wrappers and compilation functions
  * used by the test suite and client code to interact with the contracts from TypeScript
* `tests/` - TypeScript test suite for all contracts (relying on [Sandbox](https://github.com/ton-community/sandbox) for in-process tests)
* `scripts/` - Deployment scripts to mainnet/testnet and other scripts interacting with live contracts
* `build/` - Compilation artifacts created here after running a build command

### Build one of the contracts

1. You need a compilation script in `wrappers/<CONTRACT>.compile.ts` - [example](/example/wrappers/Counter.compile.ts)
2. Run interactive: &nbsp;&nbsp; `npx blueprint build` &nbsp; or &nbsp; `yarn blueprint build`
3. Non-interactive: &nbsp; `npx/yarn blueprint build <CONTRACT>`
   * Example: `yarn blueprint build counter`
4. Build results are generated in `build/<CONTRACT>.compiled.json`

### Run the test suite

1. Run in terminal: &nbsp; `npx blueprint test` &nbsp; or &nbsp; `yarn blueprint test`
2. Alternative method: &nbsp; `npm test` &nbsp; or &nbsp; `yarn test`

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

### Compilation and deployment

1. Implement a compilation script in `wrappers/<CONTRACT>.compile.ts`
2. Implement a deployment script in `scripts/deploy<CONTRACT>.ts`
3. Rely on the wrapper TypeScript class from `wrappers/<CONTRACT>.ts` to initialize the contract

&nbsp;

## Contributors

Special thanks to [@qdevstudio](https://t.me/qdevstudio) for their logo for blueprint.

## License

MIT

## Donations

TON - `EQAQR1d1Q4NaE5EefwUMdrr1QvXg-8mDB0XI2-fwDBD0nYxC`
