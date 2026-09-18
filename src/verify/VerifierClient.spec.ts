import { beginCell } from '@ton/core';

import {
    DEFAULT_VERIFIER_BACKEND,
    normalizeTransactionHash,
    VerifierClient,
    verifierApiKey,
    verifierBackend,
} from './VerifierClient';
import { prepareVerification } from './prepare';

function jsonResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('verifier environment', () => {
    it('normalizes configured values and falls back to the public backend', () => {
        expect(verifierBackend({})).toBe(DEFAULT_VERIFIER_BACKEND);
        expect(verifierBackend({ BLUEPRINT_VERIFY_BACKEND: ' http://127.0.0.1:3000/// ' })).toBe(
            'http://127.0.0.1:3000',
        );
        expect(verifierApiKey({ BLUEPRINT_VERIFY_API_KEY: ' test-key ' })).toBe('test-key');
        expect(verifierApiKey({ BLUEPRINT_VERIFY_API_KEY: ' ' })).toBeUndefined();
    });
});

describe('normalizeTransactionHash', () => {
    it('accepts hexadecimal and base64 transaction hashes', () => {
        expect(normalizeTransactionHash('AB'.repeat(32))).toBe('ab'.repeat(32));
        expect(normalizeTransactionHash(Buffer.alloc(32, 0xab).toString('base64'))).toBe('ab'.repeat(32));
    });

    it('rejects malformed transaction hashes', () => {
        expect(() => normalizeTransactionHash('not-a-hash')).toThrow('Invalid payment transaction hash');
    });
});

describe('VerifierClient', () => {
    it('requests status for both code hash and address', async () => {
        const codeHash = 'a'.repeat(64);
        const fetchMock = jest.fn(async () => jsonResponse({ code_hash: codeHash, status: 'unverified' }));
        const client = new VerifierClient('http://verifier.test/', undefined, fetchMock as unknown as typeof fetch);

        await expect(client.status(codeHash, 'EQAddress')).resolves.toEqual({
            code_hash: codeHash,
            status: 'unverified',
        });

        const calls = fetchMock.mock.calls as unknown as Array<[URL, RequestInit?]>;
        const url = calls[0][0];
        expect(url.toString()).toBe(
            `http://verifier.test/api/v1/verification/status?code_hash=${codeHash}&address=EQAddress`,
        );
    });

    it('rejects a response for a different code hash', async () => {
        const fetchMock = jest.fn(async () => jsonResponse({ code_hash: 'b'.repeat(64), status: 'verified' }));
        const client = new VerifierClient('http://verifier.test', undefined, fetchMock as unknown as typeof fetch);

        await expect(client.status('a'.repeat(64))).rejects.toThrow('returned a different code hash');
    });

    it('turns verifier payment errors into actionable messages', async () => {
        const fetchMock = jest.fn(async () =>
            jsonResponse({ error: 'payment_not_found: transaction is not indexed' }, 402),
        );
        const client = new VerifierClient('http://verifier.test', undefined, fetchMock as unknown as typeof fetch);

        await expect(client.takeTicket('a'.repeat(64))).rejects.toThrow(
            'Payment transaction was not found on TON testnet.',
        );
    });

    it('uploads multipart sources with the API key', async () => {
        const codeHash = 'a'.repeat(64);
        const fetchMock = jest.fn(async () =>
            jsonResponse({
                code_hash: codeHash,
                compiled_code_hash: codeHash,
                verification_result: 'match',
            }),
        );
        const client = new VerifierClient('http://verifier.test', 'test-key', fetchMock as unknown as typeof fetch);
        const prepared = prepareVerification({
            lang: 'tolk',
            code: beginCell().endCell(),
            fiftCode: '',
            stderr: '',
            version: '1.2.0',
            snapshot: [{ filename: 'main.tolk', content: 'tolk 1.0' }],
        });

        await expect(client.verify(prepared, codeHash)).resolves.toMatchObject({ verification_result: 'match' });

        const calls = fetchMock.mock.calls as unknown as Array<[URL, RequestInit]>;
        const init = calls[0][1];
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ 'X-Verifier-Key': 'test-key' });
        expect(init.body).toBeInstanceOf(FormData);
        expect((init.body as FormData).getAll('files')).toHaveLength(1);
    });
});
