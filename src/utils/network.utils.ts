import { Network } from '../network/Network';

const MAINNET_NETWORK_GLOBAL_ID = -239;
const TESTNET_NETWORK_GLOBAL_ID = -3;
const TETRA_NETWORK_GLOBAL_ID = 662387;

export const TETRA_DOMAIN = {
    type: 'l2',
    globalId: TETRA_NETWORK_GLOBAL_ID,
} as const;

export function getW5NetworkGlobalId(network: Network): number {
    switch (network) {
        case 'testnet':
            return TESTNET_NETWORK_GLOBAL_ID;
        case 'mainnet':
            return MAINNET_NETWORK_GLOBAL_ID;
        case 'tetra':
            return MAINNET_NETWORK_GLOBAL_ID;
    }
    return TESTNET_NETWORK_GLOBAL_ID;
}
