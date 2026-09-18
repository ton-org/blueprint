import { Address, beginCell, Cell, ContractProvider, fromNano, Transaction } from '@ton/core';

import { Config } from '../config/Config';
import { MAINNET_NETWORK, TESTNET_NETWORK } from '../network/constants';
import { Args as NetworkArgs, createNetworkProvider } from '../network/createNetworkProvider';
import { Network } from '../network/Network';
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

export function formatVerifierPaymentAddress(network: Network, address: Address): string {
    return address.toString({ testOnly: network === TESTNET_NETWORK });
}

export function formatVerifierPaymentAmount(amount: bigint): string {
    return `${fromNano(amount)} GRAM`;
}

export function buildVerifierPaymentPrompt(network: Network, amount: bigint, address: Address): string {
    return `Send ${formatVerifierPaymentAmount(amount)} on TON ${network} to ${formatVerifierPaymentAddress(network, address)}?`;
}

export function validatePaymentTicket(ticket: PaymentTicket): { address: Address; amount: bigint; network: Network } {
    if (ticket.network !== TESTNET_NETWORK) {
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
    return { address, amount, network: ticket.network };
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
    senderAddress: Address,
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
    if (info.src === null || info.src === undefined) {
        return false;
    }
    if (!info.src.equals(senderAddress)) {
        return false;
    }
    if (messageComment(inMessage.body) !== comment) {
        return false;
    }
    if (!('aborted' in transaction.description)) {
        return false;
    }
    return !transaction.description.aborted;
}

function transactionHashBuffer(hash: bigint): Buffer {
    return Buffer.from(hash.toString(16).padStart(64, '0'), 'hex');
}

export async function findPaymentTransaction(
    provider: Pick<ContractProvider, 'getTransactions'>,
    latestTransaction: { lt: bigint; hash: Buffer },
    baselineLt: bigint,
    paymentAddress: Address,
    senderAddress: Address,
    amount: bigint,
    comment: string,
): Promise<Transaction | undefined> {
    let cursor = latestTransaction;
    while (cursor.lt > baselineLt) {
        const transactions = await provider.getTransactions(paymentAddress, cursor.lt, cursor.hash, 100);
        if (transactions.length === 0) {
            return undefined;
        }

        for (const transaction of transactions) {
            if (transaction.lt <= baselineLt) {
                return undefined;
            }
            if (isPaymentTransaction(transaction, baselineLt, paymentAddress, senderAddress, amount, comment)) {
                return transaction;
            }
        }

        const oldestTransaction = transactions[transactions.length - 1];
        if (oldestTransaction === undefined || oldestTransaction.prevTransactionLt <= baselineLt) {
            return undefined;
        }
        cursor = {
            lt: oldestTransaction.prevTransactionLt,
            hash: transactionHashBuffer(oldestTransaction.prevTransactionHash),
        };
    }

    return undefined;
}

export function paymentNetworkArgs(network: Network, options: PaymentWalletOptions = {}): NetworkArgs {
    if (network !== MAINNET_NETWORK && network !== TESTNET_NETWORK) {
        throw new Error(`Unsupported verifier payment network: ${network}`);
    }

    const networkArgs = network === MAINNET_NETWORK ? { '--mainnet': true } : { '--testnet': true };
    return {
        ...options,
        ...networkArgs,
        _: [],
    } as NetworkArgs;
}

async function waitForPaymentTransaction(
    ui: UIProvider,
    networkProvider: Awaited<ReturnType<typeof createNetworkProvider>>,
    baselineLt: bigint,
    paymentAddress: Address,
    senderAddress: Address,
    amount: bigint,
    comment: string,
    network: Network,
): Promise<string> {
    ui.setActionPrompt('Waiting for finalized recipient transaction');
    try {
        for (let attempt = 1; attempt <= PAYMENT_POLL_ATTEMPTS; attempt++) {
            const state = await networkProvider.getContractState(paymentAddress);
            const lastTransaction = state.last;
            if (lastTransaction !== null && lastTransaction !== undefined && lastTransaction.lt > baselineLt) {
                const payment = await findPaymentTransaction(
                    networkProvider.provider(paymentAddress),
                    lastTransaction,
                    baselineLt,
                    paymentAddress,
                    senderAddress,
                    amount,
                    comment,
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
        `Payment was sent, but its recipient transaction did not appear on TON ${network} within ${PAYMENT_POLL_ATTEMPTS} seconds`,
    );
}

export async function sendVerifierPayment(
    ui: UIProvider,
    config: Config | undefined,
    walletOptions: PaymentWalletOptions,
    ticket: PaymentTicket,
): Promise<string> {
    const { address, amount, network } = validatePaymentTicket(ticket);
    const confirmed = await ui.prompt(buildVerifierPaymentPrompt(network, amount, address));
    if (!confirmed) {
        throw new Error('Verification payment cancelled');
    }

    const networkProvider = await createNetworkProvider(ui, paymentNetworkArgs(network, walletOptions), config, false);
    const stateBeforePayment = await networkProvider.getContractState(address);
    const lastTransaction = stateBeforePayment.last;
    let baselineLt = 0n;
    if (lastTransaction !== null && lastTransaction !== undefined) {
        baselineLt = lastTransaction.lt;
    }
    const sender = networkProvider.sender();
    let senderAddress = sender.address;
    if (senderAddress === undefined) {
        senderAddress = await ui.inputAddress('Enter the address of the wallet sending the verification payment');
    }

    await sender.send({
        to: address,
        value: amount,
        // Blueprint send providers choose the bounce behavior internally; undefined avoids the ignored-option warning.
        bounce: undefined,
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
        network,
    );
}
