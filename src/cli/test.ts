import { execFileSync } from 'node:child_process';

import arg from 'arg';

import { Args, Runner } from './Runner';
import { helpArgs, helpMessages } from './constants';

export const argSpec = {
    '--gas-report': Boolean,
    '-g': '--gas-report',
    '--coverage': Boolean,
    '--ui': Boolean,
};

const blueprintFlags = new Set(['--gas-report', '-g', '--ui']);

export function getTestArgs(args: Args): string[] {
    return args._.slice(1).filter((arg) => !blueprintFlags.has(arg));
}

async function coverage(): Promise<void> {
    execFileSync(
        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        [
            'test',
            '--',
            '--reporters',
            '@ton/blueprint/dist/jest/CoverageReporter',
            '--setupFilesAfterEnv',
            '@ton/blueprint/dist/jest/coverageSetup',
        ],
        { stdio: 'inherit' },
    );
}

export const test: Runner = async (args, ui) => {
    const localArgs = arg({
        ...helpArgs,
        ...argSpec,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['test']);
        return;
    }
    if (localArgs['--coverage']) {
        await coverage();
        return;
    }

    let testArgs = getTestArgs(args);
    if (localArgs['--ui']) {
        testArgs = [...testArgs, '--setupFilesAfterEnv', '@ton/sandbox/dist/jest/uiSetup'];
    }

    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test', '--', ...testArgs], {
        stdio: 'inherit',
        env: {
            ...process.env,
            BENCH_DIFF: localArgs['--gas-report'] ? 'true' : 'false',
        },
    });
};
