import chalk from 'chalk';
import { execSync } from 'node:child_process';
import arg from 'arg';
import { Runner } from './Runner';
import { helpArgs } from './constants';

export const argSpec = {
    '--label': String,
    '-l': String,
};

export const snapshot: Runner = async (args, ui) => {
    const localArgs = arg({ ...argSpec, ...helpArgs });
    if (localArgs['--help'] || localArgs['-h']) {
        ui.write(`${chalk.bold('Usage:')} blueprint ${chalk.cyan('snapshot')} ${chalk.yellow(
            '[--label=<comment>|-l=<comment>]',
        )}

Run with gas usage and cells sizes collected and write new snapshot

${chalk.bold('SEE ALSO')}
  ${chalk.cyan('blueprint test --gas-report')}`);
        return;
    }
    let comment = localArgs['--label'] || localArgs['-l'];
    let testArgs = args._.slice(1); // first argument is `snapshot`, need to get rid of it
    if (typeof comment === 'undefined') {
        comment = await ui.input('enter comment:');
    } else {
        testArgs = testArgs.slice(2);
    }

    execSync(`npm test ${testArgs.join(' ')}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      BENCH_NEW: comment,
    },
  });
};
