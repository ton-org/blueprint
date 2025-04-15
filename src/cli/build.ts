import { Args, Runner } from './Runner';
import { findCompiles, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { buildAll, buildOne } from '../build';
import { helpArgs, helpMessages } from './constants';
import { getEntityName } from '../utils/cliUtils';

export async function selectCompile(ui: UIProvider, args: Args) {
    const name = (await getEntityName(
        args._,
        async () => {
            const sel = await selectFile(await findCompiles(), {
                ui,
                hint: undefined,
                import: false,
            });
            return sel.name;
        }
    ))!;
    return { name };
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
        await buildAll();
    } else {
        const sel = await selectCompile(ui, localArgs);

        await buildOne(sel.name, ui);
    }
};
