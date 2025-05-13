import { execSync } from 'node:child_process';
import arg from 'arg';
import { Runner } from './Runner';
import { helpArgs, helpMessages } from './constants';

export const argSpec = {
    '--label': String,
    '-l': '--label',
};

export const snapshot: Runner = async (args, ui) => {
    const localArgs = arg({ ...argSpec, ...helpArgs });
    if (localArgs['--help']) {
        ui.write(helpMessages['snapshot']);
        return;
    }
    let comment = localArgs['--label'];
    let testArgs = args._.slice(1); // first argument is `snapshot`, need to get rid of it
    if (typeof comment === 'undefined') {
        comment = await ui.input('Enter comment:');
    } else {
        testArgs = testArgs.slice(2);
    }
    execSync(`npm test -- ${testArgs.join(' ')}`, {
        stdio: 'inherit',
        env: {
            ...process.env,
            BENCH_NEW: comment,
        },
    });
};
