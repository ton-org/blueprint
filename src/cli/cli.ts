#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();
import arg from 'arg';
import chalk from 'chalk';
import { create } from './create';
import { run } from './run';
import { build } from './build';
import { test } from './test';
import { help } from './help';
import { UIProvider } from '../ui/UIProvider';
import { InquirerUIProvider } from '../ui/InquirerUIProvider';

const argSpec = {};

export type Args = arg.Result<typeof argSpec>;

export type Runner = (args: Args, ui: UIProvider) => Promise<void>;

const runners: Record<string, Runner> = {
    create,
    run,
    build,
    test,
    help,
};

async function main() {
    const args = arg(argSpec, {
        permissive: true,
    });

    if (args._.length === 0) {
        showHelp();
        process.exit(0);
    }

    const runner = runners[args._[0]];
    if (!runner) {
        console.log(
            chalk.redBright(` Error: command not found.`) + ` Run 'blueprint help' to see available commands\n`
        );
        process.exit(1);
    }

    const ui = new InquirerUIProvider();

    const waitingForCustomLink = args._.includes('--custom');
    await runner(
        {
            ...args,
            _: args._.filter((a, inx) => {
                // filter out the flags
                if (a.length > 1 && a[0] === '-') return false;
                // and endpoint urls
                if (waitingForCustomLink) {
                    if (
                        args._[inx - 1] === '--custom' && // url goes after --custom
                        a.startsWith('http')
                    )
                        return false;
                }
                return true;
            }),
        },
        ui
    );

    ui.close();
}

process.on('SIGINT', () => {
    process.exit(130);
});

main()
    .catch(console.error)
    .then(() => process.exit(0));

function showHelp() {
    console.log(
        chalk.blueBright(`
     ____  _    _   _ _____ ____  ____  ___ _   _ _____ 
    | __ )| |  | | | | ____|  _ \\|  _ \\|_ _| \\ | |_   _|
    |  _ \\| |  | | | |  _| | |_) | |_) || ||  \\| | | |  
    | |_) | |__| |_| | |___|  __/|  _ < | || |\\  | | |  
    |____/|_____\\___/|_____|_|   |_| \\_\\___|_| \\_| |_|  `)
    );
    console.log(chalk.blue(`                     TON development for professionals`));
    console.log(``);
    console.log(` Usage: blueprint [OPTIONS] COMMAND [ARGS]`);
    console.log(``);
    console.log(
        chalk.cyanBright(`  blueprint create`) +
            `\t` +
            chalk.whiteBright(`create a new contract with .fc source, .ts wrapper, .spec.ts test`)
    );
    console.log(`\t\t\t` + chalk.gray(`blueprint create ContractName`));
    console.log(
        chalk.cyanBright(`  blueprint build`) +
            `\t` +
            chalk.whiteBright(`builds a contract that has a .compile.ts file`)
    );
    console.log(`\t\t\t` + chalk.gray(`blueprint build ContractName`));
    console.log(
        chalk.cyanBright(`  blueprint test`) +
            `\t` +
            chalk.whiteBright(`run the full project test suite with all .spec.ts files`)
    );
    console.log(`\t\t\t` + chalk.gray(`blueprint test`));
    console.log(
        chalk.cyanBright(`  blueprint run `) +
            `\t` +
            chalk.whiteBright(`runs a script from 'scripts' directory (eg. a deploy script)`)
    );
    console.log(`\t\t\t` + chalk.gray(`blueprint run deployContractName`));
    console.log(
        chalk.cyanBright(`  blueprint help`) +
            `\t` +
            chalk.whiteBright(`shows more detailed help, also see https://github.com/ton-org/blueprint`)
    );
    console.log(`\t\t\t` + chalk.gray(`blueprint help`));
    console.log(``);
}
