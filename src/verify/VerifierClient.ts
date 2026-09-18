import { BLUEPRINT_USER_AGENT, sleep } from '../utils';
import { buildVerifyForm, type PreparedVerification } from './source';

export const DEFAULT_VERIFIER_BACKEND = 'https://verifier.ton.org';
export const VERIFY_BACKEND_ENV = 'BLUEPRINT_VERIFY_BACKEND';
export const VERIFY_API_KEY_ENV = 'BLUEPRINT_VERIFY_API_KEY';

const SOURCE_UPLOAD_ATTEMPTS = 8;

export type VerificationStatus = 'unverified' | 'queued' | 'compiling' | 'verified';

export type VerificationStatusResponse = {
    code_hash: string;
    status: VerificationStatus;
};

export type TicketResponse =
    | {
          status: 'already_verified';
          code_hash: string;
          source_bundle_hash: string;
          storage_revision: string;
      }
    | {
          status: 'payment_required';
          code_hash: string;
          network: string;
          payment_address: string;
          amount_nano: string;
          comment: string;
      };

export type PaymentTicket = Extract<TicketResponse, { status: 'payment_required' }>;

export type VerifyResponse = {
    code_hash: string;
    compiled_code_hash: string | null;
    verification_result: 'already_verified' | 'match' | 'mismatch';
    source_bundle_hash: string | null;
    storage_revision: string | null;
};

class InvalidVerifierResponseError extends Error {}

export function verifierBackend(env: Record<string, string | undefined> = process.env): string {
    const value = env[VERIFY_BACKEND_ENV];
    if (value === undefined) {
        return DEFAULT_VERIFIER_BACKEND;
    }

    const configured = value.trim().replace(/\/+$/, '');
    return configured === '' ? DEFAULT_VERIFIER_BACKEND : configured;
}

export function verifierApiKey(env: Record<string, string | undefined> = process.env): string | undefined {
    const value = env[VERIFY_API_KEY_ENV];
    if (value === undefined) {
        return undefined;
    }

    const apiKey = value.trim();
    return apiKey === '' ? undefined : apiKey;
}

export function normalizeCodeHash(hash: string): string {
    return hash.replace(/^0x/i, '').toLowerCase();
}

export function normalizeTransactionHash(value: string): string {
    const trimmed = value.trim();
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    const normalizedBase64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
        throw new Error('Invalid payment transaction hash: expected 64 hexadecimal characters or 32-byte base64');
    }
    const bytes = Buffer.from(normalizedBase64, 'base64');
    if (bytes.length !== 32) {
        throw new Error('Invalid payment transaction hash: expected 64 hexadecimal characters or 32-byte base64');
    }
    return bytes.toString('hex');
}

function ensureCodeHash(expected: string, actual: string, context: string): void {
    if (actual !== expected) {
        throw new Error(`${context} returned a different code hash: expected ${expected}, received ${actual}`);
    }
}

function invalidVerifierResponse(context: string, message: string): never {
    throw new InvalidVerifierResponseError(`${context} returned an invalid response: ${message}`);
}

async function parseVerificationStatusResponse(response: Response): Promise<VerificationStatusResponse> {
    const context = 'Verification status';
    const body = await response.json();
    const codeHash: unknown = body.code_hash;
    const status: unknown = body.status;

    if (typeof codeHash !== 'string') {
        invalidVerifierResponse(context, 'code_hash must be a string');
    }
    if (status !== 'unverified' && status !== 'queued' && status !== 'compiling' && status !== 'verified') {
        invalidVerifierResponse(context, `unknown status: ${String(status)}`);
    }

    return {
        code_hash: codeHash,
        status,
    };
}

async function parseTicketResponse(response: Response): Promise<TicketResponse> {
    const context = 'Verification ticket';
    const body = await response.json();
    const codeHash: unknown = body.code_hash;
    const status: unknown = body.status;

    if (typeof codeHash !== 'string') {
        invalidVerifierResponse(context, 'code_hash must be a string');
    }

    if (status === 'already_verified') {
        const sourceBundleHash: unknown = body.source_bundle_hash;
        const storageRevision: unknown = body.storage_revision;
        if (typeof sourceBundleHash !== 'string') {
            invalidVerifierResponse(context, 'source_bundle_hash must be a string');
        }
        if (typeof storageRevision !== 'string') {
            invalidVerifierResponse(context, 'storage_revision must be a string');
        }
        return {
            status,
            code_hash: codeHash,
            source_bundle_hash: sourceBundleHash,
            storage_revision: storageRevision,
        };
    }
    if (status === 'payment_required') {
        const network: unknown = body.network;
        const paymentAddress: unknown = body.payment_address;
        const amountNano: unknown = body.amount_nano;
        const comment: unknown = body.comment;
        if (typeof network !== 'string') {
            invalidVerifierResponse(context, 'network must be a string');
        }
        if (typeof paymentAddress !== 'string') {
            invalidVerifierResponse(context, 'payment_address must be a string');
        }
        if (typeof amountNano !== 'string') {
            invalidVerifierResponse(context, 'amount_nano must be a string');
        }
        if (typeof comment !== 'string') {
            invalidVerifierResponse(context, 'comment must be a string');
        }
        return {
            status,
            code_hash: codeHash,
            network,
            payment_address: paymentAddress,
            amount_nano: amountNano,
            comment,
        };
    }

    invalidVerifierResponse(context, `unknown status: ${String(status)}`);
}

async function parseVerifyResponse(response: Response): Promise<VerifyResponse> {
    const context = 'TON verifier';
    const body = await response.json();
    const codeHash: unknown = body.code_hash;
    const compiledCodeHash: unknown = body.compiled_code_hash;
    const verificationResult: unknown = body.verification_result;
    const sourceBundleHash: unknown = body.source_bundle_hash;
    const storageRevision: unknown = body.storage_revision;

    if (typeof codeHash !== 'string') {
        invalidVerifierResponse(context, 'code_hash must be a string');
    }
    if (compiledCodeHash !== null && typeof compiledCodeHash !== 'string') {
        invalidVerifierResponse(context, 'compiled_code_hash must be a string or null');
    }
    if (
        verificationResult !== 'already_verified' &&
        verificationResult !== 'match' &&
        verificationResult !== 'mismatch'
    ) {
        invalidVerifierResponse(context, `unknown verification_result: ${String(verificationResult)}`);
    }
    if (sourceBundleHash !== null && typeof sourceBundleHash !== 'string') {
        invalidVerifierResponse(context, 'source_bundle_hash must be a string or null');
    }
    if (storageRevision !== null && typeof storageRevision !== 'string') {
        invalidVerifierResponse(context, 'storage_revision must be a string or null');
    }

    return {
        code_hash: codeHash,
        compiled_code_hash: compiledCodeHash,
        verification_result: verificationResult,
        source_bundle_hash: sourceBundleHash,
        storage_revision: storageRevision,
    };
}

async function responseError(response: Response): Promise<string> {
    const text = await response.text();
    try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && 'error' in parsed && typeof parsed.error === 'string') {
            if (parsed.error !== '') {
                return parsed.error;
            }
        }
    } catch (_) {
        // Proxies and transport layers may return plain text instead of the API error schema.
    }
    if (text !== '') {
        return text;
    }
    if (response.statusText !== '') {
        return response.statusText;
    }
    return 'Unknown error';
}

function friendlyVerifierError(error: string): string {
    const code = error.split(':', 1)[0];
    const messages: Record<string, string> = {
        verifier_read_only: 'TON verifier is in read-only mode. Try again later.',
        payment_recovery_in_progress: 'TON verifier is rebuilding payment history. Try again shortly.',
        verification_retryable: 'Verifier source storage is temporarily unavailable. The payment remains reusable.',
        payment_tx_hash_invalid: 'Payment transaction hash is invalid.',
        payment_not_found: 'Payment transaction was not found on the requested TON network.',
        payment_invalid: 'Payment transaction is not a finalized incoming payment to the verifier wallet.',
        payment_insufficient: 'Payment amount is too small.',
        payment_code_hash_mismatch: 'Payment transaction is for a different code hash.',
        payment_used: 'Payment transaction was already used for a verification.',
        payment_in_progress: 'Payment transaction is already being processed.',
    };
    const message = messages[code];
    return message === undefined ? error : message;
}

function isTransientVerifierError(error: string): boolean {
    const code = error.split(':', 1)[0];
    return ['payment_recovery_in_progress', 'verification_retryable', 'payment_in_progress'].includes(code);
}

export class VerifierClient {
    readonly backend: string;
    private readonly apiKey: string | undefined;
    private readonly fetchImpl: typeof fetch;

    constructor(
        backend: string = verifierBackend(),
        apiKey: string | undefined = verifierApiKey(),
        fetchImpl: typeof fetch = fetch,
    ) {
        this.backend = backend.trim().replace(/\/+$/, '');
        this.apiKey = apiKey;
        this.fetchImpl = fetchImpl;
        if (this.backend === '') {
            throw new Error('Verifier backend URL must not be empty');
        }
    }

    get usesApiKey(): boolean {
        return this.apiKey !== undefined;
    }

    link(codeHash: string): string {
        return `${this.backend}/${codeHash}`;
    }

    async status(codeHash: string, address?: string): Promise<VerificationStatusResponse> {
        const url = new URL(this.apiUrl('verification/status'));
        url.searchParams.set('code_hash', codeHash);
        if (address !== undefined) {
            url.searchParams.set('address', address);
        }

        const response = await this.request(url);
        if (!response.ok) {
            throw new Error(
                `Verification status request failed: HTTP ${response.status}\n${await responseError(response)}`,
            );
        }
        const result = await parseVerificationStatusResponse(response);
        ensureCodeHash(codeHash, result.code_hash, 'Verification status');
        return result;
    }

    async takeTicket(codeHash: string): Promise<TicketResponse> {
        const response = await this.request(this.apiUrl('take_ticket'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code_hash: codeHash }),
        });
        if (!response.ok) {
            throw new Error(friendlyVerifierError(await responseError(response)));
        }

        const ticket = await parseTicketResponse(response);
        ensureCodeHash(codeHash, ticket.code_hash, 'Verification ticket');
        return ticket;
    }

    async verify(
        prepared: PreparedVerification,
        codeHash: string,
        address?: string,
        paymentTransactionHash?: string | null,
    ): Promise<VerifyResponse> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= SOURCE_UPLOAD_ATTEMPTS; attempt++) {
            try {
                const headers: Record<string, string> = {};
                if (this.apiKey !== undefined) {
                    // TODO: Remove X-Verifier-Key support after the legacy verifier migration is complete.
                    headers['X-Verifier-Key'] = this.apiKey;
                }
                const response = await this.request(this.apiUrl('verify'), {
                    method: 'POST',
                    headers,
                    body: buildVerifyForm(prepared, codeHash, address, paymentTransactionHash),
                });
                if (response.ok) {
                    const result = await parseVerifyResponse(response);
                    ensureCodeHash(codeHash, result.code_hash, 'TON verifier');
                    return result;
                }

                const error = await responseError(response);
                if (attempt < SOURCE_UPLOAD_ATTEMPTS && isTransientVerifierError(error)) {
                    await sleep(Math.min(attempt, 10) * 1000);
                    continue;
                }
                throw new Error(
                    `TON verifier request failed: HTTP ${response.status}\n${friendlyVerifierError(error)}`,
                );
            } catch (error) {
                lastError = error;
                if (
                    error instanceof InvalidVerifierResponseError ||
                    (error instanceof Error && error.message.startsWith('TON verifier request failed:'))
                ) {
                    throw error;
                }
                if (attempt < SOURCE_UPLOAD_ATTEMPTS) {
                    await sleep(Math.min(attempt, 10) * 1000);
                    continue;
                }
            }
        }

        throw new Error(`Failed to send sources to TON verifier: ${String(lastError)}`);
    }

    private apiUrl(endpoint: string): string {
        return `${this.backend}/api/v1/${endpoint}`;
    }

    private request(
        input: Parameters<typeof fetch>[0],
        init: Parameters<typeof fetch>[1] = {},
    ): ReturnType<typeof fetch> {
        const headers = new Headers(init?.headers);
        headers.set('User-Agent', BLUEPRINT_USER_AGENT);
        return this.fetchImpl(input, { ...init, headers });
    }
}
