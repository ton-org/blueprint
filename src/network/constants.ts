export const AVAILABLE_NETWORKS = ['mainnet', 'testnet', 'tetra', 'custom'] as const satisfies string[];

export const MAINNET_NETWORK_GLOBAL_ID = -239;
export const TESTNET_NETWORK_GLOBAL_ID = -3;
const TETRA_NETWORK_GLOBAL_ID = 662387;

export const TETRA_DOMAIN = {
    type: 'l2',
    globalId: TETRA_NETWORK_GLOBAL_ID,
} as const;
