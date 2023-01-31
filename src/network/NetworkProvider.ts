import {TonClient} from 'ton'
import {Address, Cell, Contract, ContractProvider, OpenedContract, Sender} from 'ton-core'
import {UIProvider} from '../ui/UIProvider'

export interface NetworkProvider {
    network(): 'mainnet' | 'testnet'
    sender(): Sender
    api(): TonClient
    provider(addr: Address): ContractProvider
    deploy(contract: Contract, value: bigint, body?: Cell, waitAttempts?: number): Promise<void>
    open<T extends Contract>(contract: T): OpenedContract<T>
    ui(): UIProvider
}
