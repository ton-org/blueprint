# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Added the `rename` command which renames contracts
- Added the `pack` command which builds and prepares a publish-ready package of contracts' wrappers

## [0.33.1] - 2025-05-16

### Fixed

- Fixed blueprint build command failure in Tact projects

## [0.33.0] - 2025-05-16

### Added

- Added `tact.config.json` support
- Added tolk v0.12 support

### Fixed

- Fixed tact counter deploy script error

## [0.32.1] - 2025-05-06

### Fixed

- Fix unexpected code duplication on parralel compile

## [0.32.0] - 2025-05-02

### Added

- Compiler version is now shown during contract build
- Added 'All Contracts' option to build wizard
- Added function to build all tact contracts, required for rebuilding before tests

### Changed

- Made error of non-PascalCase contract names nicer

### Fixed

- `blueprint build --all` now exits with a non-zero exit code on failure

## [0.31.1] - 2025-04-24

### Fixed

- Fixed build directory creation

## [0.31.0] - 2025-04-24

### Added

- Added Fift output for FunC and Tolk build command
- Added API reference in code

### Changed

- Improved CLI appearance

## [0.30.0] - 2025-04-08

### Fixed

- Fixed Tact compilation

### Changed

- Updated Tact templates and `@tact-lang/compiler` dependency to v1.6.5

## [0.29.0] - 2025-03-02

### Changed

- Tolk's stderr is now printed on successful builds

## [0.28.0] - 2025-01-17

### Changed

- Moved compilers to peer dependencies, allowing end users to use their preferred versions of compilers

## [0.27.0] - 2024-12-18

### Changed

- Updated `@ton-community/func-js` dependency to v0.9.0

## [0.26.0] - 2024-11-26

### Added

- Added support for tonapi as an API provider

## [0.25.0] - 2024-11-02

### Added

- Support for Tolk, "next-generation FunC", a new language for writing smart contracts in TON. [Tolk overview](https://docs.ton.org/develop/tolk/overview)

## [0.24.0] - 2024-09-16

### Added

- Added support for wallet v5 in the Mnemonic provider

### Changed

- Changed the default API provider to Toncenter v2 (instead of Orbs TON Access). Rate limited requests are automatically retried
- Updated dependencies

### Removed

- Removed the specialized TonHub connector. Use TON Connect instead

## [0.23.0] - 2024-09-11

### Changed

- Toncenter v2 is now used by default instead of orbs access. Rate limited API requests are automatically retried

### Removed

- Removed `@orbs-network/ton-access` dependency

## [0.22.0] - 2024-07-08

### Added

- Added support for scripts in subdirectories, for example `scripts/counter/deploy.ts`
- Added the ability to specify test files in `blueprint test` command, for example `blueprint test Counter` 

### Changed

- Separated compilables and wrappers

### Fixed

- Fixed `code overflow` error when generating QR code for ton:// link

## [0.21.0] - 2024-05-27

### Changed

- Changed `contract.tact.template` counter template to return remaining value from the message
- Updated TON Connect manifest

## [0.20.0] - 2024-05-07

### Added

- Added auto-sourcing of root `tact.config.json` files for merging compilation options with `wrappers/*.compile.ts`
- Added a warning for disabling `debug` in contract wrappers of Tact before doing production deployments

### Changed

- Changed `@tact-lang/compiler` dependency to be `^1.3.0` instead of `^1.2.0`
- Changed `compile.ts.template` template for Tact to have `debug` set to `true` by default
- Changed `contract.tact.template` empty template for Tact to mention implicit empty `init()` function

## [0.19.1] - 2024-04-12

### Fixed

- Fixed `verify` command

### Changed

- Updated readme to reflect the fact that blueprint no longer automatically adds `jsonRPC` to custom v2 endpoints

## [0.19.0] - 2024-03-27

### Changed

- Updated dependencies: func-js to 0.7.0, tonconnect sdk to 2.2.0

## [0.18.0] - 2024-03-13

### Changed

- Changed `@tact-lang/compiler` dependency to be `^1.2.0` instead of `^1.1.5`
- Updated the Tact counter template to use the new `+=` operator from Tact v1.2.0

## [0.17.0] - 2024-03-01

This release contains a breaking change.

### Changed

- Blueprint no longer automatically adds `jsonRPC` to custom v2 endpoints

### Added

- Added `set` command which can currently set func version (run `blueprint set func`)
- Added `open` and `getTransactions` to `WrappedContractProvider`
- Added cell hash to build artifacts

## [0.16.0] - 2024-02-15

### Added

- Added the `network` entry to the global config, which allows one to specify a custom network to be used instead of having to add `--custom` flags on each run
- Added the `convert` command which attempts to convert a legacy bash build script into a blueprint `.compile.ts` file
- Added the ability to pass any user data into the compile hooks

### Changed

- Improved the `verify` command

## [0.15.0] - 2023-12-15

### Added

- Added flags `--custom-version`, `--custom-key`, `--custom-type` to `run` and `verify` commands to allow better control over custom API behavior

### Changed

- `--custom` now always adds `jsonRPC` to API URL for v2 APIs

### Fixed

- Fixed argument handling

## [0.14.2] - 2023-12-01

### Changed

- Changed `@tact-lang/compiler` dependency to be `^1.1.5` instead of `^1.1.3`

## [0.14.1] - 2023-12-01

### Fixed

- Fixed test templates (added missing imports)

## [0.14.0] - 2023-11-23

### Added

- Added `verify` command to quickly verify contracts on [verifier.ton.org](https://verifier.ton.org)

## [0.13.0] - 2023-11-05

### Added

- Added plugin support
- Added custom API v2 endpoints

### Changed

- Improved docs
- Changed deployed contract explorer link to use tonviewer
- Moved `deployer` to the global `describe` context in default tests

## [0.12.1] - 2023-07-31

### Changed

- Updated all dependencies to @ton organization packages

## [0.12.0] - 2023-07-14

### Fixed

- Fixed Tact imports
- Fixed missing newlines when printing error messages while building contracts

## [0.11.0] - 2023-07-03

### Added

- Added an `options` field to the `tact` variant of `CompilerConfig`, which is of the same type as the `options` of the Tact compiler, and includes fields such as `debug`, `experimental`, etc

### Changed

- Updated Tact to 1.1.3

## [0.10.0] - 2023-06-06

### Added

- Added two optional fields to the `CompilerConfig`: `preCompileHook?: () => Promise<void>` and `postCompileHook?: (code: Cell) => Promise<void>`. The former one gets called before any compilation of the respective contract happens, the latter one - after any compilation with the compiled code cell (they are called both during the `build` command and when calling the `compile` function for the respective contracts)

### Changed

- Changed the `run` command to only show `.ts` scripts

## [0.9.0] - 2023-04-21

### Changed

- Updated dependencies, of note: func-js to use func 0.4.3, Tact to 1.1.1

## [0.8.0] - 2023-04-07

### Changed

- Changed the `help` command to contain significantly more detailed help for every command
- Added the `success: true` requirement to every template test
- Updated dependencies

## [0.7.0] - 2023-04-03

This release contains a breaking change.

### Changed

- Changed the return type of `networkProvider.api()` and the type used internally in `NetworkProvider` from `TonClient` to `TonClient4`. This is a breaking change
- Updated dependencies

## [0.6.1] - 2023-03-27

### Changed

- Changed `UIProvider.prompt` return type from `Promise<void>` to `Promise<boolean>`

## [0.6.0] - 2023-03-21

### Added

- Added support for [Tact](https://github.com/tact-lang/tact), including Tact smart contract templates
- Added `--all` option for `build` command

### Changed

- Updated dependencies

## [0.5.0] - 2023-03-13

### Changed

- `SendProvider` now returns `Promise<any>` instead of `Promise<void>` from `sendTransaction`. This allows providers using TON Connect and TonHub to return the results from their backends to the end user

## [0.4.1] - 2023-03-02

### Changed

- Changed ton peer dependency version to `>=13.4.1`

## [0.4.0] - 2023-03-01

This release contains a breaking change.

### Changed

- Changed ton-core peer dependency version to `>=0.48.0`. This is a breaking change

### Added

- Added a new mnemonic deployer. Environment variables `WALLET_MNEMONIC` and `WALLET_VERSION` must be set, or a .env file with them must be present in order for it to be usable. Tonkeeper's v4R2 wallet corresponds to v4 version in blueprint
- Added the ability to choose the explorer for the deployed contracts. Pass one of the CLI flags `--tonscan`, `--tonapi`, `--toncx`, `--dton` to choose. Tonscan is the default
- Added ton-crypto peer dependency of version `>=3.2.0`

### Fixed

- Fixed TonHub deployer's `Sent transaction` message
- Fixed `SendMode.PAY_GAS_SEPARATLY` (missing E) typo in accordance with ton-core update
- Fixed a crash when using `blueprint run` with flags but no file name

## [0.3.0] - 2023-02-27

### Added

- Added an increment counter script for the counter template
- Added `isContractDeployed(address)` method to `NetworkProvider`
- Added `waitForDeploy(address, attempts?, sleepDuration?)` method to `NetworkProvider`

### Fixed

- Fixed exit code 1 on Windows even in case of successful execution
- Fixed paths to `.fc` files in `.compile.ts` files on Windows
- Fixed `TonConnectProvider` output

### Changed

- Converted ```Deployer sender does not support `bounce` ``` error into a warning
- Added an optional `init?: { code?: Cell; data?: Cell }` argument to `provider` method on `NetworkProvider`
- `createNetworkProvider` now requires a `UIProvider`
- Removed excessive comments from counter template contract
- Changed deploy script templates to use `sendDeploy` and `waitForDeploy` instead of `deploy`
- Refactored test templates to create `Blockchain` and deploy contract in `beforeEach`
- Disabled file choice menu when there is only 1 file

### Deprecated

- Deprecated `deploy` method on `NetworkProvider`. Users are advised to use self-implemented `sendDeploy` (or similar) methods on their `Contract` instances together with `isContractDeployed` or `waitForDeploy` on `NetworkProvider`

## [0.2.0] - 2023-02-09

### Added

- Added `blueprint test` command
- Added a pretty help message
- Added a hint to indicate that contract names must be PascalCase, and a restriction that contract names must start with a capital letter
- Added a better error message on an unknown command

### Fixed

- Fixed counter templates
- Fixed an issue where using `networkProvider.provider` and `networkProvider.open` would lead to `Deployer sender does not support "bounce"` message when trying to send internal messages

### Changed

- `networkProvider.provider` and `networkProvider.open` now wrap `TonClient`'s `ContractProvider` instead of directly using it for better control over passed arguments
- Removed unnecessary `await` keywords from all templates

## [0.1.0] - 2023-02-03

### Added

- Added fully interactive and fully non-interactive modes for the `create` command
- Added `input(message)` method to `UIProvider` and `InquirerUIProvider`

### Fixed

- File selection (compilation files in `build` and scripts in `run`) now accepts CLI argument hints in any case
