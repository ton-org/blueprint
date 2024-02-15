export type CustomNetwork = {
    endpoint: string;
    version?: 'v2' | 'v4';
    key?: string;
    type?: 'mainnet' | 'testnet' | 'custom';
};
