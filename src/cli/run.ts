import { Args, Runner } from './cli';
import { createNetworkProvider } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';

export const run: Runner = async (args: Args, ui: UIProvider) => {
    require('ts-node/register');

    const { module: mod } = await selectFile(await findScripts(), {
        ui,
        hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
    });

    if (typeof mod.run !== 'function') {
        throw new Error('Function `run` is missing!');
    }

    const networkProvider = await createNetworkProvider(ui);

    if (args._.includes('--custom') == true) {
        args._ = args._.slice(2);
    }
    await mod.run(networkProvider, args._.slice(2));
};
