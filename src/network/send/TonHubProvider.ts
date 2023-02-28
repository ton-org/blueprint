import { Address, beginCell, Cell, StateInit, storeStateInit } from 'ton-core';
import { SendProvider } from './SendProvider';
import { TonhubConnector, TonhubSessionStateReady, TonhubTransactionRequest } from 'ton-x';
import qrcode from 'qrcode-terminal';
import { Storage } from '../storage/Storage';
import { UIProvider } from '../../ui/UIProvider';

const KEY_NAME = 'tonhub_session';

type SavedSession = TonhubSessionStateReady & { id: string; seed: string };

export class TonHubProvider implements SendProvider {
    #connector: TonhubConnector;
    #storage: Storage;
    #ui: UIProvider;
    #session?: SavedSession;

    constructor(network: 'mainnet' | 'testnet', storage: Storage, ui: UIProvider) {
        this.#connector = new TonhubConnector({
            network,
        });
        this.#storage = storage;
        this.#ui = ui;
    }

    private async getExistingSession() {
        const sessionString = await this.#storage.getItem(KEY_NAME);

        if (sessionString === null) return undefined;

        let session: SavedSession = JSON.parse(sessionString);

        const state = await this.#connector.getSessionState(session.id);

        if (state.state === 'ready') {
            session = {
                ...state,
                id: session.id,
                seed: session.seed,
            };

            await this.#storage.setItem(KEY_NAME, JSON.stringify(session));

            return session;
        }
    }

    private async getSession() {
        const existing = await this.getExistingSession();
        if (existing !== undefined) return existing;

        const createdSession = await this.#connector.createNewSession({
            name: 'TON template project',
            url: 'https://example.com/',
        });

        this.#ui.setActionPrompt('Connecting to wallet...\n');

        this.#ui.write('\n');

        qrcode.generate(createdSession.link, { small: true }, (qr) => this.#ui.write(qr));

        this.#ui.write('\n' + createdSession.link + '\n\n');

        this.#ui.setActionPrompt('Scan the QR code in your wallet or open the link...');

        const state = await this.#connector.awaitSessionReady(createdSession.id, 5 * 60 * 1000);

        if (state.state === 'ready') {
            const session: SavedSession = {
                ...state,
                id: createdSession.id,
                seed: createdSession.seed,
            };

            await this.#storage.setItem(KEY_NAME, JSON.stringify(session));

            return session;
        }

        throw new Error('Could not create new session');
    }

    async connect() {
        this.#session = await this.getSession();
        this.#ui.write(`Connected to wallet at address: ${Address.parse(this.#session.wallet.address).toString()}\n`);
    }

    address(): Address | undefined {
        if (!this.#session) return undefined;

        return Address.parse(this.#session.wallet.address);
    }

    async sendTransaction(address: Address, amount: bigint, payload?: Cell, stateInit?: StateInit) {
        if (!this.#session) throw new Error('TonhubProvider is not connected');

        const request: TonhubTransactionRequest = {
            seed: this.#session.seed,
            appPublicKey: this.#session.wallet.appPublicKey,
            to: address.toString(),
            value: amount.toString(),
            timeout: 5 * 60 * 1000,
            payload: payload ? payload.toBoc().toString('base64') : undefined,
            stateInit: stateInit
                ? beginCell().storeWritable(storeStateInit(stateInit)).endCell().toBoc().toString('base64')
                : undefined,
        };

        this.#ui.setActionPrompt('Sending transaction. Approve it in your wallet...');

        const response = await this.#connector.requestTransaction(request);

        if (response.type !== 'success') {
            throw new Error(`Tonhub transaction request was not successful (${response.type})`);
        }

        this.#ui.clearActionPrompt();
        this.#ui.write('Sent transaction');
    }
}
