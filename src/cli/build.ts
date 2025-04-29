import { Args, Runner } from './Runner';
import { findCompiles, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { buildAll, buildOne } from '../build';
import { helpArgs, helpMessages } from './constants';

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
        ...helpArgs,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['build']);
        return;
    }

    if (localArgs['--all']) {
        await buildAll(ui);
    } else {
        const sel = await selectCompile(ui, localArgs);

        await buildOne(sel.name, ui);
    }
};
