import { Network } from './Network';
import { MAINNET_NETWORK_GLOBAL_ID, TESTNET_NETWORK_GLOBAL_ID } from './constants';

export function getW5NetworkGlobalId(network: Network): number {
    switch (network) {
        case 'testnet':
            return TESTNET_NETWORK_GLOBAL_ID;
        case 'mainnet':
            return MAINNET_NETWORK_GLOBAL_ID;
        case 'tetra':
            return MAINNET_NETWORK_GLOBAL_ID;
    }
    return MAINNET_NETWORK_GLOBAL_ID;
}
