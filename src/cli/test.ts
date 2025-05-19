import { Runner } from './Runner';
import { execSync } from 'child_process';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';

export const argSpec = {
    '--gas-report': Boolean,
    '-g': '--gas-report',
};

export const test: Runner = async (args, ui) => {
    const localArgs = arg({
        ...helpArgs,
        ...argSpec,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['test']);
        return;
    }
    let testArgs = args._.slice(1); // first argument is `test`, need to get rid of it
    if (localArgs['--gas-report']) {
        testArgs = testArgs.slice(1);
    }
    execSync(`npm test -- ${testArgs.join(' ')}`, {
        stdio: 'inherit',
        env: {
            ...process.env,
            BENCH_DIFF: localArgs['--gas-report'] ? 'true' : 'false',
        },
    });
};
