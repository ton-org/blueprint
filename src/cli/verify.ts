import { Address } from '@ton/core';
import arg from 'arg';

import { doCompile } from '../compile/compile';
import { argSpec } from '../network/createNetworkProvider';
import { runVerificationFlow } from '../verify/flow';
import { PaymentWalletOptions } from '../verify/payment';
import { prepareVerification } from '../verify/source';
import { VerifierClient } from '../verify/VerifierClient';
import { UIProvider } from '../ui/UIProvider';
import { Args, extractFirstArg, Runner, RunnerContext } from './Runner';
import { selectContract } from './build';
import { helpArgs, helpMessages } from './constants';

const verifyArgSpec = {
    ...argSpec,
    ...helpArgs,
    '--address': String,
    '--dry-run': Boolean,
    '--payment-tx-hash': String,
};

function walletOptions(args: arg.Result<typeof verifyArgSpec>): PaymentWalletOptions {
    return {
        '--tonconnect': args['--tonconnect'],
        '--deeplink': args['--deeplink'],
        '--mnemonic': args['--mnemonic'],
        '--tonscan': args['--tonscan'],
        '--tonviewer': args['--tonviewer'],
        '--toncx': args['--toncx'],
        '--dton': args['--dton'],
    };
}

export const verify: Runner = async (_args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(verifyArgSpec);
    if (localArgs['--help']) {
        ui.write(helpMessages['verify']);
        return;
    }

    const selectedContract = await selectContract(ui, extractFirstArg(localArgs));
    ui.write(`Compiling ${selectedContract}...`);
    const result = await doCompile(selectedContract, { buildLibrary: false });
    const codeHash = result.code.hash().toString('hex');
    const address = localArgs['--address']?.trim() || undefined;
    if (address) {
        Address.parse(address);
    }

    const prepared = prepareVerification(result, localArgs['--compiler-version']);
    const client = new VerifierClient();

    ui.write(`Compiled code hash: ${codeHash}`);
    ui.write(`Using backend: ${client.backend}`);
    ui.write(`Collected ${prepared.files.length} source file${prepared.files.length === 1 ? '' : 's'}`);

    await runVerificationFlow(ui, client, {
        codeHash,
        address,
        prepared,
        dryRun: localArgs['--dry-run'] ?? false,
        paymentTransactionHash: localArgs['--payment-tx-hash'],
        walletOptions: walletOptions(localArgs),
        config: context.config,
    });
};
