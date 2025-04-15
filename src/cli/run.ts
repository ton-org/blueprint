import { Args, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { getEntityName } from '../utils/cliUtils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';

export const run: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg({ 
        ...argSpec, 
        ...helpArgs 
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['run']);
        return;
    }

    const scriptName: string | undefined = await getEntityName(
        localArgs._,
        undefined // Interactive mode is not needed here, selectFile handles it
    );
    const { module: mod } = await selectFile(await findScripts(), {
        ui,
        hint: scriptName,
    });

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!');
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    // Pass positional arguments (everything after the script name)
    const scriptArgs = localArgs._.slice(2);
    await mod.run(networkProvider, scriptArgs);
};
