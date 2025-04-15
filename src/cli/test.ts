import { Runner } from './Runner';
import { execSync } from 'child_process';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';

export const test: Runner = async (args, ui) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['test']);
        return;
    }

    // Use positional arguments after the 'test' command
    const testArgs = args._.slice(1); // first argument is 'test', needs to be removed
    
    execSync(`npm test ${testArgs.join(' ')}`, { stdio: 'inherit' });
};
