import { Address } from '@ton/core';
import arg from 'arg';
import chalk from 'chalk';

import { doCompile } from '../compile/compile';
import { runVerificationFlow } from '../verify/flow';
import type { PaymentWalletOptions } from '../verify/payment';
import { prepareVerification } from '../verify/prepare';
import { VerifierClient } from '../verify/VerifierClient';
import type { UIProvider } from '../ui/UIProvider';
import { extractFirstArg } from './Runner';
import type { Args, Runner, RunnerContext } from './Runner';
import { selectContract } from './build';
import { helpArgs, helpMessages } from './constants';

const verifyArgSpec = {
    ...helpArgs,
    '--compiler-version': String,
    '--tonconnect': Boolean,
    '--deeplink': Boolean,
    '--mnemonic': Boolean,
    '--address': String,
    '--dry-run': Boolean,
    '--payment-tx-hash': String,
};

export function parseVerifyArgs(argv: string[] = process.argv.slice(2)): arg.Result<typeof verifyArgSpec> {
    return arg(verifyArgSpec, { argv });
}

function walletOptions(args: arg.Result<typeof verifyArgSpec>): PaymentWalletOptions {
    return {
        '--tonconnect': args['--tonconnect'],
        '--deeplink': args['--deeplink'],
        '--mnemonic': args['--mnemonic'],
    };
}

export const verify: Runner = async (_args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = parseVerifyArgs();
    if (localArgs['--help']) {
        ui.write(helpMessages['verify']);
        return;
    }

    const selectedContract = await selectContract(ui, extractFirstArg(localArgs));
    ui.write(`  ${chalk.blue.bold('→')} Contract: ${chalk.cyan(selectedContract)}`);
    ui.write(`  ${chalk.blue.bold('→')} Compiling contract`);
    const result = await doCompile(selectedContract, { buildLibrary: false });
    const codeHash = result.code.hash().toString('hex');
    ui.write(`  ${chalk.green.bold('✓')} Compiled successfully`);
    ui.write(`  ${chalk.blue.bold('→')} Code hash: ${chalk.dim(`0x${codeHash}`)}`);

    const addressArgument = localArgs['--address'];
    const trimmedAddress = addressArgument === undefined ? undefined : addressArgument.trim();
    const address = trimmedAddress === undefined || trimmedAddress === '' ? undefined : trimmedAddress;
    if (address !== undefined) {
        Address.parse(address);
    }

    ui.write(`  ${chalk.blue.bold('→')} Collecting source files`);
    const prepared = prepareVerification(result, localArgs['--compiler-version']);
    const client = new VerifierClient();

    ui.write(
        `  ${chalk.green.bold('✓')} Collected ${prepared.files.length} source file${prepared.files.length === 1 ? '' : 's'}`,
    );
    ui.write(`  ${chalk.blue.bold('→')} Using TON verifier`);
    ui.write(`  ${chalk.blue.bold('→')} Using backend: ${chalk.dim(`${client.backend}/api/v1/verify`)}`);

    await runVerificationFlow(ui, client, {
        codeHash,
        address,
        prepared,
        dryRun: localArgs['--dry-run'] === undefined ? false : localArgs['--dry-run'],
        paymentTransactionHash: localArgs['--payment-tx-hash'],
        walletOptions: walletOptions(localArgs),
        config: context.config,
    });
};
