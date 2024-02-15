import { Args, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';

export const run: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(argSpec);

    const { module: mod } = await selectFile(await findScripts(), {
        ui,
        hint: localArgs._.length > 1 && localArgs._[1].length > 0 ? localArgs._[1] : undefined,
    });

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!');
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    await mod.run(networkProvider, localArgs._.slice(2));
};
