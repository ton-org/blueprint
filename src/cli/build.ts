import { Args, Runner } from './Runner';
import { findCompiles, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { buildAll, buildOne } from '../build';

export const build: Runner = async (args: Args, ui: UIProvider) => {
    require('ts-node/register');

    const localArgs = arg({
        '--all': Boolean,
    });

    if (localArgs['--all']) {
        await buildAll();
    } else {
        const sel = await selectFile(await findCompiles(), {
            ui,
            hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
            import: false,
        });

        await buildOne(sel.name, ui);
    }
};
