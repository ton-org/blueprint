import { CustomNetwork } from './CustomNetwork';
import { Plugin } from './Plugin';

export interface Config {
    plugins?: Plugin[];
    network?: 'mainnet' | 'testnet' | CustomNetwork;
    separateCompilables?: boolean;
}
