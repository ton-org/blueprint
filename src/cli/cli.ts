#!/usr/bin/env node
import arg from "arg";
import { create } from "./create";
import { run } from "./run";
import { build } from "./build";

const argSpec = {
    '--help': Boolean,

    '-h': '--help',
}

export type Args = arg.Result<typeof argSpec>

export type Runner = (args: Args) => Promise<void>

const runners: Record<string, Runner> = {
    create,
    run,
    build,
}

async function main() {
    const args = arg(argSpec, {
        permissive: true,
    })

    if (args['--help']) {
        console.log(`Usage: tinfoil [OPTIONS] COMMAND ARGS...
Options:
-h, --help - print this and exit

Commands:
create ContractName - create a new contract, includes .fc source, .ts wrapper, .spec.ts test
`)
        process.exit(0)
    }

    if (args._.length === 0) {
        console.error('No command was specified.')
        console.log('Get help by running with -h.')
        process.exit(1)
    }

    await runners[args._[0]](args)
}

main().catch(console.error).then(() => process.exit(0))