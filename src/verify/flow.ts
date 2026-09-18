import { Config } from '../config/Config';
import { UIProvider } from '../ui/UIProvider';
import { sleep } from '../utils';
import { normalizeCodeHash, normalizeTransactionHash, VerifierClient, VerifyResponse } from './VerifierClient';
import {
    formatVerifierPaymentAddress,
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
    if (response.source_bundle_hash !== undefined) {
        ui.write(`Source bundle: ${response.source_bundle_hash}`);
    }
    if (response.storage_revision !== undefined) {
        ui.write(`Storage revision: ${response.storage_revision}`);
    }
}

export function validateVerificationResult(codeHash: string, response: VerifyResponse): void {
    const compiledCodeHash = response.compiled_code_hash;
    if (response.verification_result === 'mismatch') {
        throw new Error(
            `Verification failed: compiled code hash ${compiledCodeHash === undefined ? '<unknown>' : compiledCodeHash} does not match target code hash ${response.code_hash}`,
        );
    }
    if (response.verification_result === 'match') {
        if (compiledCodeHash === undefined) {
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
            ui.write('Contract was already verified');
            ui.write(`View at: ${client.link(codeHash)}`);
            return true;
        }
        if (result.status !== previousStatus) {
            ui.write(result.status === 'queued' ? 'Verification is queued' : 'Verification is compiling');
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

    if (!client.usesApiKey && (paymentTransactionHash === null || paymentTransactionHash === undefined)) {
        ui.write('Requesting verification ticket...');
        const ticket = await client.takeTicket(codeHash);
        if (ticket.status === 'already_verified') {
            ui.write('Contract was already verified');
            writeVerificationDetails(ui, {
                code_hash: ticket.code_hash,
                verification_result: 'already_verified',
                source_bundle_hash: ticket.source_bundle_hash,
                storage_revision: ticket.storage_revision,
            });
            ui.write(`View at: ${client.link(codeHash)}`);
            return;
        }

        const payment = validatePaymentTicket(ticket);
        ui.write(`Payment network: TON ${payment.network}`);
        ui.write(`Payment amount: ${payment.amount.toString()} nanoTON`);
        ui.write(`Payment address: ${formatVerifierPaymentAddress(payment.network, payment.address)}`);
        ui.write(`Payment comment: ${ticket.comment}`);

        if (options.dryRun) {
            ui.write('Dry run: skipping payment and source upload');
            return;
        }

        paymentTransactionHash = await paymentSender(ui, options.config, options.walletOptions, ticket);
        ui.write(`Payment finalized: ${paymentTransactionHash}`);
    }

    if (options.dryRun) {
        ui.write('Dry run: skipping payment and source upload');
        return;
    }

    ui.write('Sending sources to TON verifier...');
    const verification = await client.verify(prepared, codeHash, address, paymentTransactionHash);
    validateVerificationResult(codeHash, verification);

    ui.write(
        verification.verification_result === 'already_verified'
            ? 'Contract was already verified'
            : 'Contract verification completed!',
    );
    writeVerificationDetails(ui, verification);
    ui.write(`View at: ${client.link(codeHash)}`);
}
