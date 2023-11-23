import { Args, Runner } from './Runner';
import { findCompiles, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { buildAll, buildOne } from '../build';

export async function selectCompile(ui: UIProvider, args: Args) {
    return await selectFile(await findCompiles(), {
        ui,
        hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
        import: false,
    });
}

export const build: Runner = async (args: Args, ui: UIProvider) => {
    const localArgs = arg({
        '--all': Boolean,
    });

    if (localArgs['--all']) {
        await buildAll();
    } else {
        const sel = await selectCompile(ui, args);

        await buildOne(sel.name, ui);
    }
};
