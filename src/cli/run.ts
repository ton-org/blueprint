import { Args, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { getEntityName } from '../utils/cliUtils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';
import { execSync } from 'child_process';
import process from 'process';
import * as pkgManagerService from '../pkgManager/service';
import chalk from 'chalk';

export const run: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    let localArgs: Args;
    try {
        localArgs = arg({ 
            ...argSpec, 
            ...helpArgs 
        });
    } catch (e) {
        const msg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
        if (msg.includes('unknown or unexpected option')) {
            const availableFlags = Object.keys(argSpec).join(', ');
            ui.write(msg);
            ui.write('Available options: ' + availableFlags);
            process.exit(1);
        } else {
            throw e;
        }
    }
    if ((localArgs as any)['--help']) {
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

    // Run tests only if the script name starts with "deploy"
    if (scriptName && scriptName.toLowerCase().startsWith('deploy')) {
        ui.write('Running tests before deployment...');
        
        try {
            // Use the service to run the test command
            const result = pkgManagerService.runCommand('test', []);
            if (result.status !== 0) {
                 throw new Error('Tests failed. Deployment aborted.');
            }
        } catch (e) {
            ui.write(chalk.redBright(`\n${(e as Error).message || 'Test execution failed.'}\n`));
            process.exit(1);
        }
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    // Pass positional arguments (everything after the script name)
    const scriptArgs = localArgs._.slice(2);
    await mod.run(networkProvider, scriptArgs);
};
