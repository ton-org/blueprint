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
export const helpMessages = {
    help: `Usage: blueprint help [command]

Displays this message if no command is specified, or displays detailed help for the specified command.

Blueprint is generally invoked as follows: blueprint [command] [command-args] [flags]

List of available commands:
- create
- run
- build
- set
- help
- test
- verify
- convert`,
    create: `Usage: blueprint create [contract name] [flags]

Creates a new contract together with supporting files according to a template.

Contract name must be specified in PascalCase and may only include characters a-z, A-Z, 0-9. If not specified on the command line, it will be asked interactively.

Flags:
--name <name> - explicitly specifies the contract name in PascalCase
--language <language> - specifies the programming language (func, tact, or tolk)
--type <type> - specifies the template type to use when creating the contract. If not specified on the command line, it will be asked interactively.
List of available types:
${templateTypes.map((t) => `${t.value} - ${t.name}`).join('\n')}`,
    run: `Usage: blueprint run [script name] [flags]

Runs a script from the scripts directory.

Script name is matched (ignoring case) to a file in the scripts directory. If not specified on the command line, the available scripts will be presented interactively.

Flags:
--script <script-name> - explicitly specifies the script name to run
--script-args <arg1,arg2,...> - comma-separated arguments to pass to the script
--mainnet, --testnet - specifies the network to use when running the script. If not specified on the command line, it will be asked interactively.
--custom [api-endpoint] - indicates that a custom API should be used when running the script, and the API URL optionally. (example: https://testnet.toncenter.com/api/v2/)
--custom-version - specifies the API version to use with the custom API. Options: v2 (default), v4.
--custom-key - specifies the API key to use with the custom API, can only be used with API v2.
--custom-type - specifies the network type to be indicated to scripts. Options: custom (default), mainnet, testnet.
--tonconnect, --deeplink, --mnemonic - specifies the deployer to use when running the script. If not specified on the command line, it will be asked interactively.
--tonscan, --tonviewer, --toncx, --dton - specifies the network explorer to use when displaying links to the deployed contracts. Default: tonviewer.`,
    build: `Usage: blueprint build [contract name] [flags]

Builds the specified contract according to the respective .compile.ts file. If the contract is written in Tact, all Tact-generated files (wrapper class, etc) will be placed in the build/<contract name> folder.

If contract name is not specified on the command line, the buildable contracts (that have the respective .compile.ts files under wrappers directory) will be presented interactively, unless --all flag is specified.

Flags:
--all - builds all buildable contracts instead of just one.`,
    set: `Usage: blueprint set <key> [value]
Available keys:
- func - overrides @ton-community/func-js-bin version, effectively setting the func version. The required version may be passed as the value, otherwise available versions will be displayed.`,
    test: `Usage: blueprint test [...args]

Just runs \`npm test [...args]\`, which by default runs \`jest\`.

Flags:
--args <test-arguments> - specifies the arguments to pass to npm test command`,
    verify: `Usage: blueprint verify [contract name] [flags]

Builds a contract (similar to build command) and verifies it on https://verifier.ton.org. The contract must be already deployed on the network. If the contract's name is not specified on the command line, it will be asked interactively.

Flags:
--mainnet, --testnet - specifies the network to use when running the script. If not specified on the command line, it will be asked interactively.
--custom [api-endpoint] - indicates that a custom API should be used when running the script, and the API URL optionally. (example: https://testnet.toncenter.com/api/v2/) Requires --custom-type to be specified.
--custom-version - specifies the API version to use with the custom API. Options: v2 (defualt), v4.
--custom-key - specifies the API key to use with the custom API, can only be used with API v2.
--custom-type - specifies the network type to be indicated to scripts. Options: mainnet, testnet.`,
    convert: `Usage: blueprint convert [path to build script]
Atempts to convert legacy bash build script to a blueprint compile wrapper.`,
} satisfies { [name: string]: string };
