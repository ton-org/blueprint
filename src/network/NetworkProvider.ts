import { TonClient, TonClient4 } from '@ton/ton';
import { Address, Cell, Contract, ContractProvider, OpenedContract, Sender } from '@ton/core';
import { UIProvider } from '../ui/UIProvider';

export interface NetworkProvider {
    network(): 'mainnet' | 'testnet' | 'custom';
    sender(): Sender;
    api(): TonClient4 | TonClient;
    provider(address: Address, init?: { code?: Cell; data?: Cell }): ContractProvider;
    isContractDeployed(address: Address): Promise<boolean>;
    waitForDeploy(address: Address, attempts?: number, sleepDuration?: number): Promise<void>;
    /**
     * @deprecated
     *
     * Use your Contract's `sendDeploy` method (or similar) together with `waitForDeploy` instead.
     */
    deploy(contract: Contract, value: bigint, body?: Cell, waitAttempts?: number): Promise<void>;
    open<T extends Contract>(contract: T): OpenedContract<T>;
    ui(): UIProvider;
}
