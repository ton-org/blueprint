# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2023-03-21

### Added

- Added support for [TACT](https://github.com/tact-lang/tact), including TACT smart contract templates
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