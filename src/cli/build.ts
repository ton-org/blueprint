import { Args, Runner } from './Runner';
import { findCompiles, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { buildAll, buildOne } from '../build';
import { helpArgs, helpMessages } from './constants';
import { getEntityName } from '../utils/cliUtils';

export async function selectCompile(ui: UIProvider, args: Args) {
    // Find all compilable files first
    const allCompiles = await findCompiles();
    const allCompileNames = allCompiles.map(f => f.name);

    const nameFromArgs = args._.length > 1 ? args._[1] : undefined;

    let name: string;

    if (nameFromArgs) {
        // Check if the name from args exists (case-insensitive)
        const found = allCompileNames.find(n => n.toLowerCase() === nameFromArgs.toLowerCase());
        if (!found) {
            const availableNames = allCompileNames.join(', ');
            throw new Error(`"${nameFromArgs}" not found, but available: ${availableNames}`);
        }
        // Use the correctly cased name found in the files
        name = found;
        ui.write(`Using contract: ${name}`);
    } else {
        // If no name from args, use interactive selection
        const sel = await selectFile(allCompiles, {
            ui,
            hint: undefined,
            import: false,
        });
        name = sel.name;
    }

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
