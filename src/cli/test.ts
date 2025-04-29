import { Runner } from './Runner';
import { execSync } from 'child_process';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';
import * as pkgManagerService from '../pkgManager/service';
import chalk from 'chalk';

export const test: Runner = async (args, ui) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['test']);
        return;
    }

    // Use positional arguments after the 'test' command
    const testArgs = args._.slice(1); // first argument is 'test', needs to be removed
    
    try {
        // Use the service to run the test command with arguments
        const result = pkgManagerService.runCommand('test', testArgs);
        if (result.status !== 0) {
            // Exit with the same status code as the test runner if it failed
            process.exit(result.status ?? 1);
        }
    } catch (e) {
        // Handle potential errors during command execution
        ui.write(chalk.redBright(`Failed to run test command: ${(e as Error).message || e}`));
        process.exit(1);
    }
};
