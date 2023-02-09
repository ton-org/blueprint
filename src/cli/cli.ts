#!/usr/bin/env node
import arg from 'arg';
import { create } from './create';
import { run } from './run';
import { build } from './build';
import { test } from './test';

const argSpec = {
    '--help': Boolean,

    '-h': '--help',
};

export type Args = arg.Result<typeof argSpec>;

export type Runner = (args: Args) => Promise<void>;

const runners: Record<string, Runner> = {
    create,
    run,
    build,
    test,
};

async function main() {
    const args = arg(argSpec, {
        permissive: true,
    });

    if (args['--help']) {
        console.log(`Usage: blueprint [OPTIONS] COMMAND ARGS...
Options:
-h, --help - print this and exit

Commands:
create ContractName - create a new contract, includes .fc source, .ts wrapper, .spec.ts test
build ContractName - builds a contract that has a .compile.ts file
test - runs the test suite
run scriptname - runs a script from 'scripts' folder containing a 'run' function
`);
        process.exit(0);
    }

    if (args._.length === 0) {
        console.error('No command was specified.');
        console.log('Get help by running with -h.');
        process.exit(1);
    }

    await runners[args._[0]](args);
}

process.on('SIGINT', () => {
    process.exit(130);
});

main()
    .catch(console.error)
    .then(() => process.exit(0));
