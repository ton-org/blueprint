import { TonClient, TonClient4 } from '@ton/ton';
import { Address, Cell, Contract, ContractProvider, OpenedContract, Sender, StateInit } from '@ton/core';
import { ContractAdapter } from '@ton-api/ton-adapter';
import { UIProvider } from '../ui/UIProvider';

export type BlueprintTonClient = TonClient4 | TonClient | ContractAdapter;


/**
 * Interface representing a network provider for interacting with TON blockchain.
 */
export interface NetworkProvider {
    /**
     * Returns the current network type.
     * @returns {'mainnet' | 'testnet' | 'custom'} The type of network.
     */
    network(): 'mainnet' | 'testnet' | 'custom';

    /**
     * Returns the sender used for transactions.
     * @example
     * export async function run(provider: NetworkProvider) {
     *     await provider.sender().send({
     *         to: randomAddress(),
     *         value: toNano('0.5'),
     *     })
     * }
     *
     * @returns {Sender} The sender instance.
     */
    sender(): Sender;

    /**
     * Returns the underlying TON client API. May be [TonClient4]{@link TonClient4}, [TonClient]{@link TonClient} or [ContractAdapter]{@link ContractAdapter} (TON API)
     * @returns {BlueprintTonClient} The client API used to interact with the network.
     */
    api(): BlueprintTonClient;

    /**
     * Returns a contract provider instance for a given address and optional init parameters.
     * @param {Address} address - The address of the contract.
     * @param {{ code?: Cell; data?: Cell }} [init] - Optional contact [StateInit]{@link StateInit}.
     * @returns {ContractProvider} The contract provider - class to interact with contract
     * @example
     */
    provider(address: Address, init?: { code?: Cell; data?: Cell }): ContractProvider;

    /**
     * Checks whether a contract is deployed.
     * @param {Address} address - The address to check for deployment.
     * @example
     * export async function run(provider: NetworkProvider) {
     *     const address = Address.parse('some address');
     *     const isDeployed = await provider.isContractDeployed(address);
     *     if (isDeployed) {
     *         console.log('Contract deployed');
     *     } else {
     *         console.log('Contract not deployed');
     *     }
     * }
     * @returns {Promise<boolean>} A promise that resolves to true if the contract is deployed, otherwise false.
     */
    isContractDeployed(address: Address): Promise<boolean>;

    /**
     * Waits for a contract to be deployed by polling the address.
     * @param {Address} address - The address to wait for deployment.
     * @param {number} [attempts=20] - Maximum number of attempts to check for deployment.
     * @param {number} [sleepDuration=2000] - Duration to wait between attempts, in milliseconds.
     * @example
     * await contract.sendDeploy(provider.sender(), toNano('0.05'));
     * await provider.waitForDeploy(tolkTest.address);
     * // run methods on `contract`
     * @returns {Promise<void>} A promise that resolves when the contract is deployed or the attempts are exhausted.
     */
    waitForDeploy(address: Address, attempts?: number, sleepDuration?: number): Promise<void>;

    /**
     * @deprecated
     *
     * Use your Contract's `sendDeploy` method (or similar) together with `waitForDeploy` instead.
     */
    deploy(contract: Contract, value: bigint, body?: Cell, waitAttempts?: number): Promise<void>;

    /**
     * Opens a contract instance for interaction.
     * @param {T} contract - The contract instance to open.
     * @example
     * const address = Address.parse('some address');
     * const contract = provider.open(Contract.createFromAddress(address));
     * await contract.send(provider.sender(), ...)
     * @returns {OpenedContract<T>} An opened contract wrapper for interaction.
     */
    open<T extends Contract>(contract: T): OpenedContract<T>;

    /**
     * Returns the UI provider used for writing data to graphical source (console).
     * @returns {UIProvider} The UI provider instance.
     * @example
     * const ui = provider.ui();
     * ui.write('Hello World!');
     */
    ui(): UIProvider;
}

