import { Args, Runner } from './cli';
import arg from 'arg';
import { DAPP_DIR, WRAPPERS_DIR } from '../paths';
import fs from 'fs/promises';
import { UIProvider } from '../ui/UIProvider';
import { buildOne } from './build';
import { findCompiles } from '../utils';
import { parseWrappersToJSON } from '../parse/parseWrappers';
import path from 'path';
import { TEMPLATES_DIR } from '../template';

const WRAPPERS_JSON = path.join(DAPP_DIR, 'public', 'wrappers.json');
const CONFIG_JSON = path.join(DAPP_DIR, 'public', 'config.json');

export const scaffold: Runner = async (args: Args, ui: UIProvider) => {
    require('ts-node/register');

    ui.write(`Scaffold script running, searching for wrappers...\n`);

    const localArgs = arg({
        '--update': Boolean,
    });

    ui.setActionPrompt('⏳ Compiling contracts...');
    for (const file of await findCompiles()) {
        try {
            await buildOne(file.name);
        } catch (e) {
            ui.clearActionPrompt();
            ui.write((e as any).toString());
            ui.write(`\n❌ Failed to compile ${file.name}`);
            ui.write('Please make sure you can run `blueprint build --all` successfully before scaffolding.');
            process.exit(1);
        }
    }
    ui.clearActionPrompt();
    ui.write('✅ Compiled.\n');

    let dappExisted = false;
    try {
        await fs.access(DAPP_DIR);
        dappExisted = true;
    } catch (e) {}

    if (!localArgs['--update'] || !dappExisted) {
        ui.setActionPrompt('📁 Creating dapp directory...');
        await fs.cp(path.join(TEMPLATES_DIR, 'dapp'), DAPP_DIR, { recursive: true, force: true });
        ui.clearActionPrompt();
        ui.write('✅ Created dapp directory.\n');
    }
    ui.setActionPrompt('📝 Updating dapp configs...');
    await parseWrappersToJSON(WRAPPERS_JSON, CONFIG_JSON);
    ui.clearActionPrompt();
    ui.write('✅ Updated dapp configs.\n');

    ui.setActionPrompt('📁 Moving wrappers into dapp...');
    await fs.cp(WRAPPERS_DIR, path.join(DAPP_DIR, 'src', 'wrappers'), { recursive: true, force: true });
    ui.clearActionPrompt();
    ui.write('✅ Moved wrappers into dapp.\n');

    ui.write('✅ Scaffold complete!\n');

    ui.write('\n\nTo start the dapp, run (will take a few minutes):\n\n');
    ui.write('cd dapp && yarn && yarn start\n\n');

    ui.write('To build for production, run:\n\n');
    ui.write('cd dapp && yarn && yarn build && serve -s prod\n\n');
};
