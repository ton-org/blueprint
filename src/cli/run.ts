import { Args, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';

export const run: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg({ 
        ...argSpec, 
        '--script': String,
        '--script-args': String,
        ...helpArgs 
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['run']);
        return;
    }

    const scriptName = localArgs['--script'] || 
        (localArgs._.length > 1 && localArgs._[1].length > 0 ? localArgs._[1] : undefined);

    const { module: mod } = await selectFile(await findScripts(), {
        ui,
        hint: scriptName,
    });

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!');
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    // Custom script arguments can be passed via --script-args parameter
    const scriptArgs = localArgs['--script-args'] 
        ? localArgs['--script-args'].split(',') 
        : localArgs._.slice(2);

    await mod.run(networkProvider, scriptArgs);
};
