export const MAINNET_NETWORK = 'mainnet' as const;
export const TESTNET_NETWORK = 'testnet' as const;
export const CUSTOM_NETWORK = 'custom' as const;

export const AVAILABLE_NETWORKS = [MAINNET_NETWORK, TESTNET_NETWORK, CUSTOM_NETWORK] as const satisfies string[];

export const MAINNET_NETWORK_GLOBAL_ID = -239;
export const TESTNET_NETWORK_GLOBAL_ID = -3;
