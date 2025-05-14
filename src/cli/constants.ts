import chalk from 'chalk';

export const templateTypes: { name: string; value: string }[] = [
    {
        name: 'An empty contract (FunC)',
        value: 'func-empty',
    },
    {
        name: 'An empty contract (Tolk)',
        value: 'tolk-empty',
    },
    {
        name: 'An empty contract (Tact)',
        value: 'tact-empty',
    },
    {
        name: 'A simple counter contract (FunC)',
        value: 'func-counter',
    },
    {
        name: 'A simple counter contract (Tolk)',
        value: 'tolk-counter',
    },
    {
        name: 'A simple counter contract (Tact)',
        value: 'tact-counter',
    },
];

export const helpArgs = { '--help': Boolean };

const availableCommands = ['create', 'run', 'build', 'set', 'help', 'test', 'verify', 'convert'];

export const helpMessages = {
    help: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('help')} [${chalk.yellow('command')}]

Displays this message if no command is specified, or displays detailed help for the specified command.

Blueprint is generally invoked as follows:
  ${chalk.cyan('blueprint')} ${chalk.yellow('[command]')} ${chalk.gray('[command-args]')} ${chalk.gray('[flags]')}

${chalk.bold('List of available commands:')}
${availableCommands.map(c => `- ${chalk.green(c)}`).join('\n')}`,

    create: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('create')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Creates a new contract together with supporting files according to a template.

Contract name must be specified in PascalCase and may only include characters a-z, A-Z, 0-9. If not specified on the command line, it will be asked interactively.

${chalk.bold('Flags:')}
${chalk.cyan('--type')} <type> - specifies the template type to use when creating the contract. If not specified on the command line, it will be asked interactively.

${chalk.bold('List of available types:')}
${templateTypes.map((t) => `${chalk.cyan(t.value)} - ${t.name}`).join('\n')}`,

    run: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('run')} ${chalk.yellow('[script name]')} ${chalk.gray('[flags]')}

Runs a script from the scripts directory.

Script name is matched (ignoring case) to a file in the scripts directory. If not specified on the command line, the available scripts will be presented interactively.

${chalk.bold('Flags:')}
${chalk.cyan('--mainnet')}, ${chalk.cyan('--testnet')} - selects network
${chalk.cyan('--custom')} [api-endpoint] - use a custom API
${chalk.cyan('--custom-version')} - API version (v2, v4)
${chalk.cyan('--custom-key')} - API key (v2 only)
${chalk.cyan('--custom-type')} - network type (custom, mainnet, testnet)
${chalk.cyan('--tonconnect')}, ${chalk.cyan('--deeplink')}, ${chalk.cyan('--mnemonic')} - deployer options
${chalk.cyan('--tonscan')}, ${chalk.cyan('--tonviewer')}, ${chalk.cyan('--toncx')}, ${chalk.cyan('--dton')} - explorer (default: tonviewer)`,

    build: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('build')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Builds the specified contract according to the respective .compile.ts file. For Tact contracts, all generated files will be placed in the ${chalk.cyan('build/<contract name>')} folder.

${chalk.bold('Flags:')}
${chalk.cyan('--all')} - builds all available contracts.`,

    set: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('set')} <${chalk.yellow('key')}> [${chalk.yellow('value')}]

${chalk.bold('Available keys:')}
- ${chalk.cyan('func')} - overrides @ton-community/func-js-bin version.`,

    test: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('test')} [...args]

Runs ${chalk.green('npm test [...args]')}, which by default executes ${chalk.green('jest')}.`,

    verify: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('verify')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Verifies a deployed contract on ${chalk.underline('https://verifier.ton.org')}.

${chalk.bold('Flags:')}
${chalk.cyan('--mainnet')}, ${chalk.cyan('--testnet')} - selects network
${chalk.cyan('--custom')} [api-endpoint] - use custom API (requires --custom-type)
${chalk.cyan('--custom-version')} - API version (v2 default)
${chalk.cyan('--custom-key')} - API key (v2 only)
${chalk.cyan('--custom-type')} - network type (mainnet, testnet)`,

    convert: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('convert')} ${chalk.yellow('[path to build script]')}

Attempts to convert a legacy bash build script to a Blueprint compile wrapper.`,
    rename: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('rename')} ${chalk.yellow('Old contract name (PascalCase)')} ${chalk.yellow('New contract name (PascalCase)')}

Renames contract by exact matching in wrappers, scripts, tests and contracts folders.`,

};
