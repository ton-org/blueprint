# TON project

Starter template for a new TON project - FunC contracts, unit tests, compilation and deployment scripts.

## Layout

-   `contracts` - contains the source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - contains the wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts. Would typically use the wrappers.
-   `scripts` - contains scripts used by the project, mainly the deployment scripts.   

## Repo contents / tech stack
1. Compiling FunC - [https://github.com/ton-community/func-js](https://github.com/ton-community/func-js)
2. Testing TON smart contracts - [https://github.com/ton-community/sandbox](https://github.com/ton-community/sandbox)
3. Deployment of contracts is supported with [TON Connect 2](https://github.com/ton-connect/), [Tonhub wallet](https://tonhub.com/), using mnemonics, or via a direct `ton://` deeplink

## How to use
* Run `npm create ton@latest`

### Building a contract
1. Interactively
   1. Run `yarn blueprint build`
   2. Choose the contract you'd like to build
1. Non-interactively
   1. Run `yarn blueprint build <CONTRACT>`
   2. example: `yarn blueprint build pingpong`

### Deploying a contract
1. Interactively
   1. Run `yarn blueprint run`
   2. Choose the contract you'd like to deploy
   3. Choose whether you're deploying on mainnet or testnet
   4. Choose how to deploy:
      1. With a TON Connect compatible wallet
      2. A `ton://` deep link / QR code
      3. Tonhub wallet
      4. Mnemonic
   5. Deploy the contract
2. Non-interactively
   1. Run `yarn blueprint run <CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
   2. example: `yarn blueprint run pingpong --mainnet --tonconnect`

### Testing
1. Run `yarn test`

## Adding your own contract
1. Run `yarn blueprint create <CONTRACT>`
2. example: `yarn blueprint create MyContract`

* Write code
  * FunC contracts are located in `contracts/*.fc`
    * Standalone root contracts are located in `contracts/*.fc`
    * Shared imports (when breaking code to multiple files) are in `contracts/imports/*.fc`
  * Tests in TypeScript are located in `test/*.spec.ts`
  * Wrapper classes for interacting with the contract are located in `wrappers/*.ts`
  * Any scripts (including deployers) are located in `scripts/*.ts`

* Build
  * Builder configs are located in `wrappers/*.compile.ts`
  * In the root repo dir, run in terminal `yarn blueprint build`
  * Compilation errors will appear on screen, if applicable
  * Resulting build artifacts include:
    * `build/*.compiled.json` - the binary code cell of the compiled contract (for deployment). Saved in a hex format within a json file to support webapp imports

* Test
  * In the root repo dir, run in terminal `yarn test`
  * Don't forget to build (or rebuild) before running tests
  * Tests are running inside Node.js by running TVM in web-assembly using [sandbox](https://github.com/ton-community/sandbox)

* Deploy
  * Run `yarn blueprint run <deployscript>`
  * Contracts will be rebuilt on each execution
  * Follow the on-screen instructions of the deploy script
  
# License
MIT
