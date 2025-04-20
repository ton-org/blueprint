import { Args, Runner, RunnerContext } from './Runner';
import { createNetworkProvider, argSpec } from '../network/createNetworkProvider';
import { findScripts, selectFile } from '../utils';
import { getEntityName } from '../utils/cliUtils';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';
import { execSync } from 'child_process';
import process from 'process';

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

    // Run tests only if the script name starts with "deploy"
    if (scriptName && scriptName.toLowerCase().startsWith('deploy')) {
        ui.write('Running tests before deployment...');
        
        // Detect package manager
        let pkgManager = (process.env.npm_config_user_agent ?? 'npm/').split(' ')[0].split('/')[0];
        let testCmd = 'npm test';
        switch (pkgManager) {
            case 'yarn':
                testCmd = 'yarn test';
                break;
            case 'pnpm':
                testCmd = 'pnpm test';
                break;
            case 'bun':
                testCmd = 'bun test';
                break;
        }
        
        try {
            execSync(testCmd, { stdio: 'inherit' });
        } catch (e) {
            ui.write('\nTests failed. Deployment aborted.\n');
            return;
        }
    }

    const networkProvider = await createNetworkProvider(ui, localArgs, context.config);

    // Pass positional arguments (everything after the script name)
    const scriptArgs = localArgs._.slice(2);
    await mod.run(networkProvider, scriptArgs);
};
