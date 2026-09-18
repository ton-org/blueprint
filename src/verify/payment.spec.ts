import { Address, internal } from '@ton/core';
import type { Transaction } from '@ton/core';

import { MAINNET_NETWORK, TESTNET_NETWORK } from '../network/constants';
import type { PaymentTicket } from './VerifierClient';
import {
    buildTextCommentBody,
    buildVerifierPaymentComment,
    buildVerifierPaymentPrompt,
    findPaymentTransaction,
    formatVerifierPaymentAmount,
    isPaymentTransaction,
    paymentNetworkArgs,
    validatePaymentTicket,
} from './payment';

const codeHash = 'ab'.repeat(32);
const paymentAddress = new Address(0, Buffer.alloc(32, 1));
const senderAddress = new Address(0, Buffer.alloc(32, 2));
const comment = buildVerifierPaymentComment(codeHash);

function paymentTicket(overrides: Partial<PaymentTicket> = {}): PaymentTicket {
    return {
        status: 'payment_required',
        code_hash: codeHash,
        network: TESTNET_NETWORK,
        payment_address: paymentAddress.toString({ testOnly: true }),
        amount_nano: '10000000',
        comment,
        ...overrides,
    };
}

function paymentTransaction(
    overrides: {
        amount?: bigint;
        comment?: string;
        lt?: bigint;
        previousLt?: bigint;
        previousHash?: bigint;
        sender?: Address | null;
    } = {},
): Transaction {
    const message = internal({
        to: paymentAddress,
        value: overrides.amount === undefined ? 10_000_000n : overrides.amount,
        body: buildTextCommentBody(overrides.comment === undefined ? comment : overrides.comment),
        bounce: true,
    });
    if (message.info.type !== 'internal') {
        throw new Error('Expected an internal message');
    }
    message.info.src = overrides.sender === undefined ? senderAddress : overrides.sender;

    return {
        lt: overrides.lt === undefined ? 2n : overrides.lt,
        prevTransactionLt: overrides.previousLt === undefined ? 1n : overrides.previousLt,
        prevTransactionHash: overrides.previousHash === undefined ? 1n : overrides.previousHash,
        inMessage: message,
        description: { type: 'generic', aborted: false },
    } as unknown as Transaction;
}

describe('buildTextCommentBody', () => {
    it('serializes a zero-opcode text comment', () => {
        const body = buildTextCommentBody('verification payment').beginParse();

        expect(body.loadUint(32)).toBe(0);
        expect(body.loadStringTail()).toBe('verification payment');
    });
});

describe('buildVerifierPaymentComment', () => {
    it('combines the verifier name, protocol version, and code hash', () => {
        expect(buildVerifierPaymentComment(codeHash)).toBe(`acton-verify:v1:${codeHash}`);
    });
});

describe('buildVerifierPaymentPrompt', () => {
    it('includes the network from the payment ticket', () => {
        expect(buildVerifierPaymentPrompt(MAINNET_NETWORK, 100_000n, paymentAddress)).toBe(
            `Send 0.0001 GRAM on TON mainnet to ${paymentAddress.toString()}?`,
        );
    });
});

describe('formatVerifierPaymentAmount', () => {
    it('formats nanoGRAMs without losing precision', () => {
        expect(formatVerifierPaymentAmount(100_000n)).toBe('0.0001 GRAM');
        expect(formatVerifierPaymentAmount(1_234_500_000n)).toBe('1.2345 GRAM');
    });
});

describe('validatePaymentTicket', () => {
    it('accepts a matching testnet payment quote', () => {
        const payment = validatePaymentTicket(paymentTicket());

        expect(payment.address.equals(paymentAddress)).toBe(true);
        expect(payment.amount).toBe(10_000_000n);
        expect(payment.network).toBe(TESTNET_NETWORK);
    });

    it('rejects an unexpected network, comment, or amount', () => {
        expect(() => validatePaymentTicket(paymentTicket({ network: 'mainnet' }))).toThrow('unsupported network');
        expect(() => validatePaymentTicket(paymentTicket({ comment: 'wrong' }))).toThrow('different code hash');
        expect(() => validatePaymentTicket(paymentTicket({ amount_nano: '0' }))).toThrow('invalid payment amount');
    });
});

describe('isPaymentTransaction', () => {
    it('matches the finalized recipient transaction', () => {
        expect(
            isPaymentTransaction(paymentTransaction(), 1n, paymentAddress, senderAddress, 10_000_000n, comment),
        ).toBe(true);
    });

    it('rejects stale and mismatching transactions', () => {
        expect(
            isPaymentTransaction(
                paymentTransaction({ lt: 1n }),
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).toBe(false);
        expect(
            isPaymentTransaction(
                paymentTransaction({ amount: 1n }),
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).toBe(false);
        expect(
            isPaymentTransaction(
                paymentTransaction({ comment: 'wrong' }),
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).toBe(false);
        expect(
            isPaymentTransaction(
                paymentTransaction({ sender: new Address(0, Buffer.alloc(32, 3)) }),
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).toBe(false);
        expect(
            isPaymentTransaction(
                paymentTransaction({ sender: null }),
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).toBe(false);
    });

    it('rejects transactions without an explicit successful aborted flag', () => {
        const transaction = {
            ...paymentTransaction(),
            description: { type: 'storage' },
        } as unknown as Transaction;

        expect(isPaymentTransaction(transaction, 1n, paymentAddress, senderAddress, 10_000_000n, comment)).toBe(false);
    });
});

describe('findPaymentTransaction', () => {
    it('follows transaction history pages until the payment or baseline', async () => {
        const previousHash = 0x42n;
        const newerTransaction = paymentTransaction({
            lt: 3n,
            previousLt: 2n,
            previousHash,
            comment: 'different payment',
        });
        const payment = paymentTransaction({ lt: 2n, previousLt: 1n });
        const getTransactions = jest.fn().mockResolvedValueOnce([newerTransaction]).mockResolvedValueOnce([payment]);

        await expect(
            findPaymentTransaction(
                { getTransactions },
                { lt: 3n, hash: Buffer.alloc(32, 1) },
                1n,
                paymentAddress,
                senderAddress,
                10_000_000n,
                comment,
            ),
        ).resolves.toBe(payment);
        expect(getTransactions).toHaveBeenNthCalledWith(
            2,
            paymentAddress,
            2n,
            Buffer.from(previousHash.toString(16).padStart(64, '0'), 'hex'),
            100,
        );
    });
});

describe('paymentNetworkArgs', () => {
    it('uses the payment network while retaining the selected wallet', () => {
        expect(paymentNetworkArgs(TESTNET_NETWORK, { '--tonconnect': true })).toMatchObject({
            '--testnet': true,
            '--tonconnect': true,
        });
        expect(paymentNetworkArgs(MAINNET_NETWORK, { '--mnemonic': true })).toMatchObject({
            '--mainnet': true,
            '--mnemonic': true,
        });
    });
});
