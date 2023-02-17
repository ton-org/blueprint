import { TonClient } from 'ton';
import { Address, Cell, Contract, ContractProvider, OpenedContract, Sender } from 'ton-core';
import { UIProvider } from '../ui/UIProvider';

export interface NetworkProvider {
    network(): 'mainnet' | 'testnet';
    sender(): Sender;
    api(): TonClient;
    provider(addr: Address): ContractProvider;
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
