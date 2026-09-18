import chalk from 'chalk';

import { Config } from '../config/Config';
import { Network } from '../network/Network';
import { UIProvider } from '../ui/UIProvider';
import { sleep } from '../utils';
import { normalizeCodeHash, normalizeTransactionHash, VerifierClient, VerifyResponse } from './VerifierClient';
import {
    formatVerifierPaymentAddress,
    formatVerifierPaymentAmount,
    PaymentWalletOptions,
    sendVerifierPayment,
    validatePaymentTicket,
} from './payment';
import { PreparedVerification } from './source';

const VERIFIER_STATUS_POLL_ATTEMPTS = 50;
const VERIFIER_STATUS_POLL_INTERVAL = 1000;

export type VerificationFlowOptions = {
    codeHash: string;
    address?: string;
    prepared: PreparedVerification;
    compilerVersion?: string;
    dryRun: boolean;
    paymentTransactionHash?: string | null;
    walletOptions: PaymentWalletOptions;
    config?: Config;
};

type PaymentSender = typeof sendVerifierPayment;

function writeVerificationDetails(ui: UIProvider, response: VerifyResponse): void {
    if (response.source_bundle_hash !== null) {
        ui.write(`  ${chalk.blue.bold('→')} Source bundle: ${chalk.dim(response.source_bundle_hash)}`);
    }
    if (response.storage_revision !== null) {
        ui.write(`  ${chalk.blue.bold('→')} Storage revision: ${chalk.dim(response.storage_revision)}`);
    }
}

export function validateVerificationResult(codeHash: string, response: VerifyResponse): void {
    const compiledCodeHash = response.compiled_code_hash;
    if (response.verification_result === 'mismatch') {
        throw new Error(
            `Verification failed: compiled code hash ${compiledCodeHash === null ? '<unknown>' : compiledCodeHash} does not match target code hash ${response.code_hash}`,
        );
    }
    if (response.verification_result === 'match') {
        if (compiledCodeHash === null) {
            throw new Error('TON verifier reported a match without a matching compiled code hash');
        }
        if (compiledCodeHash !== codeHash) {
            throw new Error('TON verifier reported a match without a matching compiled code hash');
        }
    }
}

async function waitForExistingVerification(
    ui: UIProvider,
    client: VerifierClient,
    codeHash: string,
    address?: string,
): Promise<boolean> {
    let previousStatus: 'queued' | 'compiling' | undefined;
    for (let attempt = 1; attempt <= VERIFIER_STATUS_POLL_ATTEMPTS; attempt++) {
        const result = await client.status(codeHash, address);
        if (result.status === 'unverified') {
            return false;
        }
        if (result.status === 'verified') {
            ui.write(`  ${chalk.green.bold('✓')} Contract was already verified`);
            ui.write('');
            ui.write(`View at: ${chalk.blue(client.link(codeHash))}`);
            return true;
        }
        if (result.status !== previousStatus) {
            ui.write(
                result.status === 'queued'
                    ? `  ${chalk.blue.bold('→')} Verification is queued`
                    : `  ${chalk.blue.bold('→')} Verification is compiling`,
            );
        }

        previousStatus = result.status;
        if (attempt < VERIFIER_STATUS_POLL_ATTEMPTS) {
            await sleep(VERIFIER_STATUS_POLL_INTERVAL);
        }
    }

    throw new Error(`Verification is still queued or compiling after ${VERIFIER_STATUS_POLL_ATTEMPTS} status checks`);
}

export async function runVerificationFlow(
    ui: UIProvider,
    client: VerifierClient,
    options: VerificationFlowOptions,
    paymentSender: PaymentSender = sendVerifierPayment,
): Promise<void> {
    const codeHash = normalizeCodeHash(options.codeHash);
    const { address, prepared } = options;
    if (await waitForExistingVerification(ui, client, codeHash, address)) {
        return;
    }

    let paymentTransactionHash =
        options.paymentTransactionHash === null || options.paymentTransactionHash === undefined
            ? undefined
            : normalizeTransactionHash(options.paymentTransactionHash);
    let paymentNetwork: Network | undefined;

    if (!client.usesApiKey) {
        ui.write(`  ${chalk.blue.bold('→')} Requesting verification ticket`);
        const ticket = await client.takeTicket(codeHash);
        if (ticket.status === 'already_verified') {
            ui.write(`  ${chalk.green.bold('✓')} Contract was already verified`);
            writeVerificationDetails(ui, {
                code_hash: ticket.code_hash,
                compiled_code_hash: null,
                verification_result: 'already_verified',
                source_bundle_hash: ticket.source_bundle_hash,
                storage_revision: ticket.storage_revision,
            });
            ui.write('');
            ui.write(`View at: ${chalk.blue(client.link(codeHash))}`);
            return;
        }

        const payment = validatePaymentTicket(ticket);
        paymentNetwork = payment.network;
        ui.write(`  ${chalk.blue.bold('→')} Payment network: TON ${payment.network}`);
        ui.write(
            `  ${chalk.blue.bold('→')} Payment amount: ${chalk.cyan(formatVerifierPaymentAmount(payment.amount))}`,
        );
        ui.write(
            `  ${chalk.blue.bold('→')} Payment address: ${chalk.dim(formatVerifierPaymentAddress(payment.network, payment.address))}`,
        );
        ui.write(`  ${chalk.blue.bold('→')} Payment comment: ${chalk.dim(ticket.comment)}`);

        if (paymentTransactionHash === undefined) {
            if (!options.dryRun) {
                paymentTransactionHash = await paymentSender(ui, options.config, options.walletOptions, ticket);
                ui.write(`  ${chalk.green.bold('✓')} Payment finalized: ${chalk.dim(paymentTransactionHash)}`);
            }
        } else {
            ui.write(
                `  ${chalk.blue.bold('→')} Reusing ${payment.network} payment transaction: ${chalk.dim(paymentTransactionHash)}`,
            );
        }
    }

    if (options.dryRun) {
        const skipped = paymentNetwork === undefined ? 'source upload' : `${paymentNetwork} payment and source upload`;
        ui.write(`  ${chalk.blue.bold('ℹ')} Dry run mode: skipping ${skipped}`);
        ui.write('');
        ui.write(chalk.green.bold('✓ TON verifier request prepared successfully!'));
        ui.write(`  Backend: ${chalk.dim(`${client.backend}/api/v1/verify`)}`);
        ui.write(`  Source files: ${chalk.dim(prepared.files.length.toString())}`);
        return;
    }

    ui.write(`  ${chalk.blue.bold('→')} Sending sources to TON verifier`);
    const verification = await client.verify(prepared, codeHash, address, paymentTransactionHash);
    validateVerificationResult(codeHash, verification);

    if (verification.verification_result === 'already_verified') {
        ui.write(`  ${chalk.green.bold('✓')} Contract was already verified`);
    } else {
        ui.write(`  ${chalk.green.bold('✓')} TON verifier accepted source bundle`);
    }
    writeVerificationDetails(ui, verification);
    ui.write('');
    if (verification.verification_result === 'match') {
        ui.write(chalk.green.bold('✓ Contract verification completed!'));
    }
    ui.write(`View at: ${chalk.blue(client.link(codeHash))}`);
}
