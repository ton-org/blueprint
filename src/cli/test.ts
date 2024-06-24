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

    execSync('npm test', { stdio: 'inherit' });
};
