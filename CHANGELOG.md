# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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