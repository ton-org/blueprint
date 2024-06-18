import { Config } from './Config';
import { BLUEPRINT_CONFIG, COMPILABLES_DIR, WRAPPERS_DIR } from '../paths';
import fs from 'fs/promises';
import { findCompiles } from '../utils';
import path from 'path';
import { UIProvider } from '../ui/UIProvider';
import { existsSync, mkdirSync } from 'fs';

export async function getConfig(): Promise<Config | undefined> {
    try {
        const configModule = await import(BLUEPRINT_CONFIG);
        if (!('config' in configModule) || typeof configModule.config !== 'object') {
            return undefined;
        }
        return configModule.config;
    } catch {
        return undefined;
    }
}

export async function enableSeparateCompilablesFeature(ui?: UIProvider): Promise<void> {
    const config = await getConfig();

    if (config?.separateCompilables) {
        return;
    }

    if (!config) {
        await fs.writeFile(BLUEPRINT_CONFIG, `export const config = { separateCompilables: true };`, 'utf-8');
    } else {
        await fs.appendFile(BLUEPRINT_CONFIG, '\nconfig.separateCompilables = true;\n', 'utf-8');
    }

    const oldCompilables = await findCompiles(WRAPPERS_DIR);
    if (!existsSync(COMPILABLES_DIR)) {
        ui?.write('Creating compilables directory...');
        mkdirSync(COMPILABLES_DIR);
    }

    ui?.write('Separating compiles and wrappers files...');
    await Promise.all(
        oldCompilables.map(async (compilable) => {
            await fs.copyFile(compilable.path, path.join(COMPILABLES_DIR, compilable.name + '.compile.ts'));
            await fs.rm(compilable.path);
        }),
    );
}
