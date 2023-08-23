import { Address, beginCell, Cell, StateInit, storeStateInit } from '@ton/core';
import { SendProvider } from './SendProvider';
import { tonDeepLink } from '../../utils';
import qrcode from 'qrcode-terminal';
import { UIProvider } from '../../ui/UIProvider';

export class DeeplinkProvider implements SendProvider {
    #ui: UIProvider;

    constructor(ui: UIProvider) {
        this.#ui = ui;
    }

    async connect(): Promise<void> {
        return;
    }

    async sendTransaction(address: Address, amount: bigint, payload?: Cell, stateInit?: StateInit) {
        const deepLink = tonDeepLink(
            address,
            amount,
            payload,
            stateInit ? beginCell().storeWritable(storeStateInit(stateInit)).endCell() : undefined
        );

        this.#ui.write('\n');
        qrcode.generate(deepLink, { small: true }, (qr) => this.#ui.write(qr));
        this.#ui.write('\n');
        this.#ui.write(deepLink);
        this.#ui.write('\nScan the QR code above, or open the ton:// link to send this transaction');

        await this.#ui.prompt('Press enter when transaction was issued');
    }

    address(): Address | undefined {
        return undefined;
    }
}
