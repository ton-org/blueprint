import { execSync } from 'child_process';

import arg from 'arg';

import { Runner } from './Runner';
import { helpArgs, helpMessages } from './constants';

export const argSpec = {
    '--gas-report': Boolean,
    '-g': '--gas-report',
    '--coverage': Boolean,
};

export async function coverage(): Promise<void> {
    execSync(
        `npm test -- --reporters @ton/blueprint/dist/jest/CoverageReporter --setupFilesAfterEnv @ton/blueprint/dist/jest/coverageSetup`,
        {
            stdio: 'inherit',
        },
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
