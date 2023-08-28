import { UIProvider } from '../ui/UIProvider';
import { Args, Runner } from './cli';
import { templateTypes } from './create';

const helpMessages: { [name: string]: string } = {
    help: `Usage: blueprint help [command]

Displays this message if no command is specified, or displays detailed help for the specified command.

Blueprint is generally invoked as follows: blueprint [command] [command-args] [flags]

List of available commands:
- create
- run
- build
- scaffold
- help
- test`,
    create: `Usage: blueprint create [contract name] [flags]

Creates a new contract together with supporting files according to a template.

Contract name must be specified in PascalCase and may only include characters a-z, A-Z, 0-9. If not specified on the command line, it will be asked interactively.

Flags:
--type <type> - specifies the template type to use when creating the contract. If not specified on the command line, it will be asked interactively.
List of available types:
${templateTypes.map((t) => `${t.value} - ${t.name}`).join('\n')}`,
    run: `Usage: blueprint run [script name] [flags]

Runs a script from the scripts directory.

Script name is matched (ignoring case) to a file in the scripts directory. If not specified on the command line, the available scripts will be presented interactively.

Flags:
--mainnet, --testnet - specifies the network to use when running the script. If not specified on the command line, it will be asked interactively.
--custom [api-v2-endpoint] - indicates that a custom API should be used when running the script, and the API URL optionally.
--tonconnect, --tonhub, --deeplink, --mnemonic - specifies the deployer to use when running the script. If not specified on the command line, it will be asked interactively.
--tonscan, --tonviewer, --toncx, --dton - specifies the network explorer to use when displaying links to the deployed contracts. Default: tonscan.`,
    build: `Usage: blueprint build [contract name] [flags]

Builds the specified contract according to the respective .compile.ts file. If the contract is written in TACT, all TACT-generated files (wrapper class, etc) will be placed in the build/<contract name> folder.

If contract name is not specified on the command line, the buildable contracts (that have the respective .compile.ts files under wrappers directory) will be presented interactively, unless --all flag is specified.

Flags:
--all - builds all buildable contracts instead of just one.`,
    scaffold: `Usage: blueprint scaffold [flags]

Generates a dapp using the contracts described in the wrappers/ directory. 

Flags:
--update - prevents regenerating whole dapp, and just updates wrappers, already included in destination directory. Does not affect if generating very first time.`,
    test: `Usage: blueprint test

Just runs \`npm test\`, which by default runs \`jest\`.`,
};

export const help: Runner = async (args: Args, ui: UIProvider) => {
    const cmd = args._.length >= 2 ? args._[1].toLowerCase() : '';

    const helpMessage = cmd in helpMessages ? helpMessages[cmd] : helpMessages['help'];

    ui.write(helpMessage);
};
