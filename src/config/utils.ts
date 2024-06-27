import { Config } from './Config';
import { BLUEPRINT_CONFIG } from '../paths';

let config: Config | undefined;

export async function getConfig(): Promise<Config | undefined> {
    if (config) {
        return config;
    }

    try {
        const configModule = await import(BLUEPRINT_CONFIG);
        if (!('config' in configModule) || typeof configModule.config !== 'object') {
            return undefined;
        }
        config = configModule.config;

        return config;
    } catch {
        return undefined;
    }
}
