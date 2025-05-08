import { existsSync, readFileSync, writeFileSync } from 'fs';

import { parseConfig, Config as TactConfig } from '@tact-lang/compiler';

import { TACT_ROOT_CONFIG } from '../paths';

export const defaultConfig: TactConfig = {
    $schema: 'https://raw.githubusercontent.com/tact-lang/tact/main/src/config/configSchema.json',
    projects: [],
};

export function getRootTactConfig(): TactConfig {
    if (!existsSync(TACT_ROOT_CONFIG)) {
        return defaultConfig;
    }

    return parseConfig(readFileSync(TACT_ROOT_CONFIG).toString());
}

export function updateRootTactConfig(config: TactConfig) {
    writeFileSync(TACT_ROOT_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
}

export { TactConfig };
