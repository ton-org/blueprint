import { Runner } from './Runner';
import { execSync } from 'child_process';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';

export const test: Runner = async (args, ui) => {
    const localArgs = arg({
        '--args': String,
        ...helpArgs
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['test']);
        return;
    }

    // Use --args parameter if provided, otherwise use the original command-line arguments
    const testArgs = localArgs['--args'] 
        ? [localArgs['--args']] 
        : args._.slice(1); // first argument is `test`, need to get rid of it
    
    execSync(`npm test ${testArgs.join(' ')}`, { stdio: 'inherit' });
};
