import chalk from 'chalk';

export const templateTypes: { name: string; value: string }[] = [
    {
        name: 'An empty contract (Tolk)',
        value: 'tolk-empty',
    },
    {
        name: 'An empty contract (FunC)',
        value: 'func-empty',
    },
    {
        name: 'An empty contract (Tact)',
        value: 'tact-empty',
    },
    {
        name: 'A simple counter contract (Tolk)',
        value: 'tolk-counter',
    },
    {
        name: 'A simple counter contract (FunC)',
        value: 'func-counter',
    },
    {
        name: 'A simple counter contract (Tact)',
        value: 'tact-counter',
    },
];

export const helpArgs = { '--help': Boolean, '-h': '--help' };

export type KnownCommandName =
    | 'create'
    | 'run'
    | 'build'
    | 'set'
    | 'help'
    | 'test'
    | 'verify'
    | 'convert'
    | 'rename'
    | 'pack'
    | 'snapshot';

export interface CommandInfo {
    readonly name: KnownCommandName;
    readonly description: string;
    readonly example: string;
}

export const availableCommands: CommandInfo[] = [
    {
        name: 'create',
        description: 'create a new contract with .fc source, .ts wrapper, .spec.ts test',
        example: 'blueprint create ContractName',
    },
    {
        name: 'build',
        description: 'builds a contract that has a .compile.ts file',
        example: 'blueprint build ContractName',
    },
    { name: 'test', description: 'run the full project test suite with all .spec.ts files', example: 'blueprint test' },
    {
        name: 'run',
        description: "runs a script from 'scripts' directory (eg. a deploy script)",
        example: 'blueprint run deployContractName',
    },
    {
        name: 'help',
        description: 'shows more detailed help, also see https://github.com/ton-org/blueprint',
        example: 'blueprint help',
    },
    { name: 'set', description: 'sets configuration values', example: 'blueprint set' },
    { name: 'verify', description: 'verifies a deployed contract on verifier.ton.org', example: 'blueprint verify' },
    {
        name: 'convert',
        description: 'converts legacy bash build scripts to Blueprint wrappers',
        example: 'blueprint convert',
    },
    {
        name: 'rename',
        description: 'renames contract by matching in wrappers, scripts and tests',
        example: 'blueprint rename',
    },
    { name: 'pack', description: 'builds and prepares a publish-ready package of wrappers', example: 'blueprint pack' },
    {
        name: 'snapshot',
        description: 'creates snapshots with gas usage and cells sizes',
        example: 'blueprint snapshot',
    },
];

export const helpMessages = {
    help: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('help')} [${chalk.yellow('command')}]

Displays this message if no command is specified, or displays detailed help for the specified command.

Blueprint is generally invoked as follows:
  ${chalk.cyan('blueprint')} ${chalk.yellow('[command]')} ${chalk.gray('[command-args]')} ${chalk.gray('[flags]')}

${chalk.bold('List of available commands:')}
${availableCommands.map((c) => `  ${chalk.cyanBright(c.name)}${' '.repeat(Math.max(0, 20 - c.name.length))}${c.description}`).join('\n')}

To get more information about a command, run ${chalk.cyan('blueprint help <command>')}`,

    create: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('create')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Creates a new contract together with supporting files according to a template.

Contract name must be specified in PascalCase and may only include characters a-z, A-Z, 0-9. If not specified on the command line, it will be asked interactively.

${chalk.bold('Flags:')}
${chalk.cyan('--type')} <type> - specifies the template type to use when creating the contract. If not specified on the command line, it will be asked interactively.

${chalk.bold('List of available types:')}
${templateTypes.map((t) => `${chalk.cyan(t.value)} - ${t.name}`).join('\n')}`,

    run: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('run')} ${chalk.yellow('[script name]')} ${chalk.gray('[flags]')} ${chalk.gray('[...args]')}

Runs a script from the scripts directory.

Script name is matched (ignoring case) to a file in the scripts directory. If not specified on the command line, the available scripts will be presented interactively.

${chalk.bold('Flags:')}
${chalk.cyan('--mainnet')}, ${chalk.cyan('--testnet')} - selects network
${chalk.cyan('--custom')} [api-endpoint] - use a custom API
${chalk.cyan('--custom-version')} - API version (v2, v4)
${chalk.cyan('--custom-key')} - API key (v2 only)
${chalk.cyan('--custom-type')} - network type (custom, mainnet, testnet)
${chalk.cyan('--tonconnect')}, ${chalk.cyan('--deeplink')}, ${chalk.cyan('--mnemonic')} - deployer options
${chalk.cyan('--tonscan')}, ${chalk.cyan('--tonviewer')}, ${chalk.cyan('--toncx')}, ${chalk.cyan('--dton')} - explorer (default: tonviewer)
${chalk.gray('[...args]')} (array of strings, optional) - Arguments passed directly to the script.
                            
${chalk.bold('Examples:')}
blueprint run ${chalk.yellow('deployCounter')} ${chalk.cyan('--testnet')} ${chalk.cyan('--tonconnect')}
blueprint run ${chalk.yellow('incrementCounter')} ${chalk.cyan('--testnet')} ${chalk.cyan('--tonconnect')} ${chalk.gray('0.05 1')}`,

    build: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('build')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Builds the specified contract according to the respective .compile.ts file. For Tact contracts, all generated files will be placed in the ${chalk.cyan('build/<contract name>')} folder.

${chalk.bold('Flags:')}
${chalk.cyan('--all')} - builds all available contracts.`,

    set: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('set')} <${chalk.yellow('key')}> [${chalk.yellow('value')}]

${chalk.bold('Available keys:')}
- ${chalk.cyan('func')} - overrides @ton-community/func-js-bin version.`,

    test: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('test')} ${chalk.yellow('[--gas-report|-g ...args]')}
Runs ${chalk.green('npm test [...args]')}, which by default executes ${chalk.green('jest')}

${chalk.bold('Options:')}
  ${chalk.cyan('--gas-report')}, ${chalk.cyan('-g')} - Run tests and compare with the last snapshot's metrics
  ${chalk.cyan('--ui')} - Connects to sandbox UI server
  ${chalk.cyan('--coverage')} - Collects tests coverage

${chalk.bold('SEE ALSO')}
  ${chalk.cyan('blueprint snapshot')}
`,

    verify: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('verify')} ${chalk.yellow('[contract name]')} ${chalk.gray('[flags]')}

Verifies a deployed contract on ${chalk.underline('https://verifier.ton.org')}.

${chalk.bold('Flags:')}
${chalk.cyan('--mainnet')}, ${chalk.cyan('--testnet')} - selects network
${chalk.cyan('--compiler-version')} - specifies the exact compiler version to use (e.g. ${chalk.cyan('0.4.4-newops.1')}). Note: this does not change the underlying compiler itself.
${chalk.cyan('--custom')} [api-endpoint] - use custom API (requires --custom-type)
${chalk.cyan('--custom-version')} - API version (v2 default)
${chalk.cyan('--custom-key')} - API key (v2 only)
${chalk.cyan('--custom-type')} - network type (mainnet, testnet)`,

    convert: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('convert')} ${chalk.yellow('[path to build script]')}

Attempts to convert a legacy bash build script to a Blueprint compile wrapper.`,
    rename: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('rename')} ${chalk.yellow('[old contract name (PascalCase)]')} ${chalk.yellow('[new contract name (PascalCase)]')}

Renames contract by exact matching in wrappers, scripts, tests and contracts folders.`,
    pack: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('pack')}

Builds and prepares a publish-ready package of contract wrappers.

${chalk.bold('Flags:')}
${chalk.cyan('--no-warn')}, ${chalk.cyan('-n')} - ignore warnings about modifying tsconfig.json, package.json, and removing the dist directory.`,
    snapshot: `${chalk.bold('Usage:')} blueprint ${chalk.cyan('snapshot')} ${chalk.yellow(
        '[--label=<comment>|-l=<comment>]',
    )}

Run with gas usage and cells' sizes collected and write a new snapshot

${chalk.bold('SEE ALSO')}
  ${chalk.cyan('blueprint test --gas-report')}`,
};
