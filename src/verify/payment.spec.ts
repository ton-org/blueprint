import { Address, beginCell, internal, Transaction } from '@ton/core';

import { PaymentTicket } from './VerifierClient';
import { isPaymentTransaction, paymentNetworkArgs, validatePaymentTicket } from './payment';

const codeHash = 'ab'.repeat(32);
const paymentAddress = new Address(0, Buffer.alloc(32, 1));
const senderAddress = new Address(0, Buffer.alloc(32, 2));
const comment = `acton-verify:v1:${codeHash}`;

function paymentTicket(overrides: Partial<PaymentTicket> = {}): PaymentTicket {
    return {
        status: 'payment_required',
        code_hash: codeHash,
        network: 'testnet',
        payment_address: paymentAddress.toString({ testOnly: true }),
        amount_nano: '10000000',
        comment,
        ...overrides,
    };
}

function paymentTransaction(overrides: { amount?: bigint; comment?: string; lt?: bigint } = {}): Transaction {
    const message = internal({
        to: paymentAddress,
        value: overrides.amount ?? 10_000_000n,
        body: beginCell()
            .storeUint(0, 32)
            .storeStringTail(overrides.comment ?? comment)
            .endCell(),
        bounce: true,
    });
    if (message.info.type !== 'internal') {
        throw new Error('Expected an internal message');
    }
    message.info.src = senderAddress;

    return {
        lt: overrides.lt ?? 2n,
        inMessage: message,
        description: { type: 'generic', aborted: false },
    } as unknown as Transaction;
}

describe('validatePaymentTicket', () => {
    it('accepts a matching testnet payment quote', () => {
        const payment = validatePaymentTicket(paymentTicket());

        expect(payment.address.equals(paymentAddress)).toBe(true);
        expect(payment.amount).toBe(10_000_000n);
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
    });

    it('rejects transactions without an explicit successful aborted flag', () => {
        const transaction = {
            ...paymentTransaction(),
            description: { type: 'storage' },
        } as unknown as Transaction;

        expect(isPaymentTransaction(transaction, 1n, paymentAddress, senderAddress, 10_000_000n, comment)).toBe(false);
    });
});

describe('paymentNetworkArgs', () => {
    it('always pays on testnet while retaining the selected wallet', () => {
        expect(paymentNetworkArgs({ '--tonconnect': true })).toMatchObject({
            '--testnet': true,
            '--tonconnect': true,
        });
    });
});
