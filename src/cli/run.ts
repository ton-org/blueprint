import arg from 'arg';

import { Args, extractFirstArg, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import { helpArgs, helpMessages } from './constants';

export const run: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg({ ...argSpec, ...helpArgs });
    if (localArgs['--help']) {
        ui.write(helpMessages['run']);
        return;
    }

    const { module: mod } = await selectFile(await findScripts(), {
        ui,
        hint: extractFirstArg(localArgs),
    });

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!');
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    await mod.run(networkProvider, localArgs._.slice(2));
};
