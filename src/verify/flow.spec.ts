import type { UIProvider } from '../ui/UIProvider';
import { TESTNET_NETWORK } from '../network/constants';
import { runVerificationFlow } from './flow';
import type { VerificationFlowOptions } from './flow';
import { buildVerifierPaymentComment } from './payment';
import { VerifierClient } from './VerifierClient';
import type { PaymentTicket, VerifyResponse } from './VerifierClient';

const codeHash = 'ab'.repeat(32);
const prepared = {
    language: 'func' as const,
    compileParams: { compiler_version: '0.4.6' },
    files: [
        {
            source: {
                path: 'main.fc',
                is_entrypoint: true,
            },
            content: '() recv_internal() {}',
        },
    ],
};

function uiProvider(): UIProvider {
    return {
        write: jest.fn(),
        prompt: jest.fn(),
        inputAddress: jest.fn(),
        input: jest.fn(),
        choose: jest.fn(),
        setActionPrompt: jest.fn(),
        clearActionPrompt: jest.fn(),
    };
}

function flowOptions(overrides: Partial<VerificationFlowOptions> = {}): VerificationFlowOptions {
    return {
        codeHash,
        prepared,
        dryRun: false,
        walletOptions: {},
        ...overrides,
    };
}

function verifyResponse(overrides: Partial<VerifyResponse> = {}): VerifyResponse {
    return {
        code_hash: codeHash,
        compiled_code_hash: codeHash,
        verification_result: 'match',
        source_bundle_hash: null,
        storage_revision: null,
        ...overrides,
    };
}

function verifierClient(
    options: {
        usesApiKey?: boolean;
        ticket?: PaymentTicket;
        verification?: VerifyResponse;
    } = {},
): VerifierClient {
    return {
        backend: 'http://verifier.test',
        usesApiKey: options.usesApiKey === undefined ? true : options.usesApiKey,
        link: jest.fn((hash: string) => `http://verifier.test/${hash}`),
        status: jest.fn(async () => ({ code_hash: codeHash, status: 'unverified' as const })),
        takeTicket: jest.fn(async () => {
            if (options.ticket === undefined) {
                throw new Error('Payment ticket is not configured for this test');
            }
            return options.ticket;
        }),
        verify: jest.fn(async () => (options.verification === undefined ? verifyResponse() : options.verification)),
    } as unknown as VerifierClient;
}

function paymentTicket(): PaymentTicket {
    return {
        status: 'payment_required',
        code_hash: codeHash,
        network: TESTNET_NETWORK,
        payment_address: `0:${'01'.repeat(32)}`,
        amount_nano: '10000000',
        comment: buildVerifierPaymentComment(codeHash),
    };
}

describe('runVerificationFlow', () => {
    it('uploads directly when an API key is configured', async () => {
        const ui = uiProvider();
        const client = verifierClient();
        const paymentSender = jest.fn();

        await runVerificationFlow(ui, client, flowOptions(), paymentSender);

        expect(client.takeTicket).not.toHaveBeenCalled();
        expect(paymentSender).not.toHaveBeenCalled();
        expect(client.verify).toHaveBeenCalledWith(prepared, codeHash, undefined, undefined);
        expect(ui.write).toHaveBeenNthCalledWith(1, '  → Sending sources to TON verifier');
        expect(ui.write).toHaveBeenNthCalledWith(2, '  ✓ TON verifier accepted source bundle');
        expect(ui.write).toHaveBeenNthCalledWith(3, '');
        expect(ui.write).toHaveBeenNthCalledWith(4, '✓ Contract verification completed!');
        expect(ui.write).toHaveBeenNthCalledWith(5, `View at: http://verifier.test/${codeHash}`);
    });

    it('normalizes the code hash once at the flow boundary', async () => {
        const ui = uiProvider();
        const client = verifierClient();

        await runVerificationFlow(ui, client, flowOptions({ codeHash: `0x${codeHash.toUpperCase()}` }));

        expect(client.status).toHaveBeenCalledWith(codeHash, undefined);
        expect(client.verify).toHaveBeenCalledWith(prepared, codeHash, undefined, undefined);
    });

    it('gets a ticket but does not pay or upload during a dry run', async () => {
        const ui = uiProvider();
        const client = verifierClient({ usesApiKey: false, ticket: paymentTicket() });
        const paymentSender = jest.fn();

        await runVerificationFlow(
            ui,
            client,
            flowOptions({ dryRun: true, paymentTransactionHash: null }),
            paymentSender,
        );

        expect(client.takeTicket).toHaveBeenCalledWith(codeHash, 'func', '0.4.6');
        expect(paymentSender).not.toHaveBeenCalled();
        expect(client.verify).not.toHaveBeenCalled();
        expect(ui.write).toHaveBeenCalledWith('  → Payment amount: 0.01 GRAM');
        expect(ui.write).toHaveBeenCalledWith('✓ TON verifier request prepared successfully!');
    });

    it('passes the finalized payment hash to verification', async () => {
        const ui = uiProvider();
        const ticket = paymentTicket();
        const client = verifierClient({ usesApiKey: false, ticket });
        const paymentSender = jest.fn(async () => 'cd'.repeat(32));

        await runVerificationFlow(ui, client, flowOptions(), paymentSender);

        expect(client.takeTicket).toHaveBeenCalledWith(codeHash, 'func', '0.4.6');
        expect(paymentSender).toHaveBeenCalledWith(ui, undefined, {}, ticket);
        expect(client.verify).toHaveBeenCalledWith(prepared, codeHash, undefined, 'cd'.repeat(32));
    });

    it('requests a ticket and reports a reused payment transaction', async () => {
        const ui = uiProvider();
        const ticket = paymentTicket();
        const client = verifierClient({ usesApiKey: false, ticket });
        const paymentSender = jest.fn();
        const paymentTransactionHash = 'cd'.repeat(32);

        await runVerificationFlow(ui, client, flowOptions({ paymentTransactionHash }), paymentSender);

        expect(client.takeTicket).toHaveBeenCalledWith(codeHash, 'func', '0.4.6');
        expect(paymentSender).not.toHaveBeenCalled();
        expect(ui.write).toHaveBeenCalledWith(`  → Reusing testnet payment transaction: ${paymentTransactionHash}`);
        expect(client.verify).toHaveBeenCalledWith(prepared, codeHash, undefined, paymentTransactionHash);
    });

    it('uses the prepared compiler version for both the ticket and source upload', async () => {
        const ui = uiProvider();
        const client = verifierClient({ usesApiKey: false, ticket: paymentTicket() });
        const paymentSender = jest.fn(async () => 'cd'.repeat(32));
        const preparedWithOverride = {
            ...prepared,
            compileParams: { compiler_version: '0.4.5' },
        };

        await runVerificationFlow(ui, client, flowOptions({ prepared: preparedWithOverride }), paymentSender);

        expect(client.takeTicket).toHaveBeenCalledWith(codeHash, 'func', '0.4.5');
        expect(client.verify).toHaveBeenCalledWith(preparedWithOverride, codeHash, undefined, 'cd'.repeat(32));
    });

    it('stops before payment and source upload when the verifier disables the compiler', async () => {
        const ui = uiProvider();
        const error = 'compiler_disabled: func@0.4.6 is disabled by server configuration';
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ code_hash: codeHash, status: 'unverified' })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ error }), { status: 403 }));
        const client = new VerifierClient('http://verifier.test', undefined, fetchMock as unknown as typeof fetch);
        const paymentSender = jest.fn();

        await expect(runVerificationFlow(ui, client, flowOptions(), paymentSender)).rejects.toThrow(error);

        expect(paymentSender).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[1][0]).toBe('http://verifier.test/api/v1/take_ticket');
    });

    it('rejects a verifier match with a different compiled hash', async () => {
        const ui = uiProvider();
        const client = verifierClient({
            verification: verifyResponse({ compiled_code_hash: 'cd'.repeat(32) }),
        });

        await expect(runVerificationFlow(ui, client, flowOptions())).rejects.toThrow(
            'without a matching compiled code hash',
        );
    });

    it('stops before upload when the code hash is already verified', async () => {
        const ui = uiProvider();
        const client = verifierClient();
        client.status = jest.fn(async () => ({ code_hash: codeHash, status: 'verified' as const }));

        await runVerificationFlow(ui, client, flowOptions());

        expect(client.verify).not.toHaveBeenCalled();
        expect(ui.write).toHaveBeenCalledWith('  ✓ Contract was already verified');
    });
});
