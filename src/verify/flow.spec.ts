import { UIProvider } from '../ui/UIProvider';
import { runVerificationFlow, VerificationFlowOptions } from './flow';
import { buildVerifierPaymentComment } from './payment';
import { PaymentTicket, VerifierClient, VerifyResponse } from './VerifierClient';

const codeHash = 'ab'.repeat(32);
const prepared = {
    language: 'tolk' as const,
    compileParams: { compiler_version: '1.2.0' },
    files: [
        {
            source: {
                path: 'main.tolk',
                is_entrypoint: true,
            },
            content: 'tolk 1.0',
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
        network: 'testnet',
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

        expect(client.takeTicket).toHaveBeenCalledWith(codeHash);
        expect(paymentSender).not.toHaveBeenCalled();
        expect(client.verify).not.toHaveBeenCalled();
    });

    it('passes the finalized payment hash to verification', async () => {
        const ui = uiProvider();
        const ticket = paymentTicket();
        const client = verifierClient({ usesApiKey: false, ticket });
        const paymentSender = jest.fn(async () => 'cd'.repeat(32));

        await runVerificationFlow(ui, client, flowOptions(), paymentSender);

        expect(paymentSender).toHaveBeenCalledWith(ui, undefined, {}, ticket);
        expect(client.verify).toHaveBeenCalledWith(prepared, codeHash, undefined, 'cd'.repeat(32));
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
        expect(ui.write).toHaveBeenCalledWith('Contract was already verified');
    });
});
