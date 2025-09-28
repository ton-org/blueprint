import { Network } from '../network/Network';
import { NetworkVersion } from '../network/NetworkVersion';

export type CustomNetwork = {
    endpoint: string;
    version?: NetworkVersion;
    key?: string;
    type?: Network;
};
