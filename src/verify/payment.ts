import { Address, beginCell, Cell, Transaction } from '@ton/core';

import { Config } from '../config/Config';
import { Args as NetworkArgs, createNetworkProvider } from '../network/createNetworkProvider';
import { UIProvider } from '../ui/UIProvider';
import { sleep } from '../utils';
import { PaymentTicket } from './VerifierClient';

const VERIFIER_PAYMENT_COMMENT_PREFIX = 'acton-verify';
const VERIFIER_PAYMENT_COMMENT_VERSION = 'v1';

const PAYMENT_POLL_ATTEMPTS = 60;
const PAYMENT_POLL_INTERVAL = 1000;

export type PaymentWalletOptions = Pick<NetworkArgs, '--tonconnect' | '--deeplink' | '--mnemonic'>;

export function buildTextCommentBody(comment: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
}

export function buildVerifierPaymentComment(codeHash: string): string {
    return `${VERIFIER_PAYMENT_COMMENT_PREFIX}:${VERIFIER_PAYMENT_COMMENT_VERSION}:${codeHash}`;
}

export function validatePaymentTicket(ticket: PaymentTicket): { address: Address; amount: bigint } {
    if (ticket.network !== 'testnet') {
        throw new Error(`TON verifier requested payment on unsupported network: ${ticket.network}`);
    }
    if (ticket.comment !== buildVerifierPaymentComment(ticket.code_hash)) {
        throw new Error('TON verifier returned a payment comment for a different code hash');
    }

    const address = Address.parse(ticket.payment_address);
    if (address.workChain !== 0) {
        throw new Error('TON verifier returned a non-basechain payment address');
    }
    const amount = BigInt(ticket.amount_nano);
    if (amount <= 0n) {
        throw new Error('TON verifier returned an invalid payment amount');
    }
    return { address, amount };
}

function messageComment(body: Cell): string | undefined {
    try {
        const slice = body.beginParse();
        if (slice.loadUint(32) !== 0) {
            return undefined;
        }
        return slice.loadStringTail();
    } catch (_) {
        return undefined;
    }
}

export function isPaymentTransaction(
    transaction: Transaction,
    baselineLt: bigint,
    paymentAddress: Address,
    senderAddress: Address | undefined,
    amount: bigint,
    comment: string,
): boolean {
    if (transaction.lt <= baselineLt) {
        return false;
    }

    const inMessage = transaction.inMessage;
    if (inMessage === null || inMessage === undefined) {
        return false;
    }
    if (inMessage.info.type !== 'internal') {
        return false;
    }

    const info = inMessage.info;
    if (!info.dest.equals(paymentAddress)) {
        return false;
    }
    if (info.value.coins < amount) {
        return false;
    }
    if (info.bounced) {
        return false;
    }
    if (senderAddress !== undefined) {
        if (info.src === null || info.src === undefined) {
            return false;
        }
        if (!info.src.equals(senderAddress)) {
            return false;
        }
    }
    if (messageComment(inMessage.body) !== comment) {
        return false;
    }
    if (!('aborted' in transaction.description)) {
        return false;
    }
    return !transaction.description.aborted;
}

export function paymentNetworkArgs(options: PaymentWalletOptions = {}): NetworkArgs {
    return {
        ...options,
        _: [],
        '--testnet': true,
    } as NetworkArgs;
}

async function waitForPaymentTransaction(
    ui: UIProvider,
    networkProvider: Awaited<ReturnType<typeof createNetworkProvider>>,
    baselineLt: bigint,
    paymentAddress: Address,
    senderAddress: Address | undefined,
    amount: bigint,
    comment: string,
): Promise<string> {
    ui.setActionPrompt('Waiting for finalized verifier payment...');
    try {
        for (let attempt = 1; attempt <= PAYMENT_POLL_ATTEMPTS; attempt++) {
            const state = await networkProvider.getContractState(paymentAddress);
            const lastTransaction = state.last;
            if (lastTransaction !== null && lastTransaction !== undefined && lastTransaction.lt > baselineLt) {
                const transactions = await networkProvider
                    .provider(paymentAddress)
                    .getTransactions(paymentAddress, lastTransaction.lt, lastTransaction.hash, 100);
                const payment = transactions.find((transaction) =>
                    isPaymentTransaction(transaction, baselineLt, paymentAddress, senderAddress, amount, comment),
                );
                if (payment !== undefined) {
                    return payment.hash().toString('hex');
                }
            }
            if (attempt < PAYMENT_POLL_ATTEMPTS) {
                await sleep(PAYMENT_POLL_INTERVAL);
            }
        }
    } finally {
        ui.clearActionPrompt();
    }

    throw new Error(
        `Payment was sent, but its recipient transaction did not appear on TON testnet within ${PAYMENT_POLL_ATTEMPTS} seconds`,
    );
}

export async function sendVerifierPayment(
    ui: UIProvider,
    config: Config | undefined,
    walletOptions: PaymentWalletOptions,
    ticket: PaymentTicket,
): Promise<string> {
    const { address, amount } = validatePaymentTicket(ticket);
    const confirmed = await ui.prompt(
        `Send ${amount.toString()} nanoTON on testnet to ${address.toString({ testOnly: true })}?`,
    );
    if (!confirmed) {
        throw new Error('Verification payment cancelled');
    }

    const networkProvider = await createNetworkProvider(ui, paymentNetworkArgs(walletOptions), config, false);
    const stateBeforePayment = await networkProvider.getContractState(address);
    const lastTransaction = stateBeforePayment.last;
    let baselineLt = 0n;
    if (lastTransaction !== null && lastTransaction !== undefined) {
        baselineLt = lastTransaction.lt;
    }
    const senderAddress = networkProvider.sender().address;

    await networkProvider.sender().send({
        to: address,
        value: amount,
        bounce: true,
        body: buildTextCommentBody(ticket.comment),
    });

    return await waitForPaymentTransaction(
        ui,
        networkProvider,
        baselineLt,
        address,
        senderAddress,
        amount,
        ticket.comment,
    );
}
