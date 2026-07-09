import { execFileSync } from 'node:child_process';

import arg from 'arg';

import { Args, Runner } from './Runner';
import { helpArgs, helpMessages } from './constants';

export const argSpec = {
    '--label': String,
    '-l': '--label',
};

export function getSnapshotTestArgs(args: Args): string[] {
    const testArgs: string[] = [];
    const rawArgs = args._.slice(1);

    for (let i = 0; i < rawArgs.length; i++) {
        const arg = rawArgs[i];
        if (arg === '--label' || arg === '-l') {
            i++;
            continue;
        }
        if (arg.startsWith('--label=') || arg.startsWith('-l=')) {
            continue;
        }
        testArgs.push(arg);
    }

    return testArgs;
}

export const snapshot: Runner = async (args, ui) => {
    const localArgs = arg({ ...argSpec, ...helpArgs });
    if (localArgs['--help']) {
        ui.write(helpMessages['snapshot']);
        return;
    }
    let comment = localArgs['--label'];
    if (typeof comment === 'undefined') {
        comment = await ui.input('Enter comment:');
    }
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test', '--', ...getSnapshotTestArgs(args)], {
        stdio: 'inherit',
        env: {
            ...process.env,
            BENCH_NEW: comment,
        },
    });
};
