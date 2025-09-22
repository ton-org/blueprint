import { Address, beginCell, Cell, Message, storeMessage } from '@ton/core';
import { Explorer } from '../network/Explorer';

/**
 * Generates a TON deep link for transfer.
 *
 * @param {Address} address - The recipient's TON address.
 * @param {bigint} amount - The amount of nanoTON to send.
 * @param {Cell} [body] - Optional message body as a Cell.
 * @param {Cell} [stateInit] - Optional state init cell for deploying a contract.
 * @param {boolean} testOnly - Optional flag to determine output address format
 * @returns {string} A URL deep link that can be opened in TON wallets.
 *
 * @example
 * const link = tonDeepLink(myAddress, 10_000_000n); // 0.01 TON
 * // "ton://transfer/..."
 */
export const tonDeepLink = (
    address: Address,
    amount: bigint,
    body?: Cell,
    stateInit?: Cell,
    testOnly?: boolean,
): string =>
    `ton://transfer/${address.toString({
        testOnly,
        urlSafe: true,
        bounceable: true,
    })}?amount=${amount.toString()}${body ? '&bin=' + body.toBoc().toString('base64url') : ''}${
        stateInit ? '&init=' + stateInit.toBoc().toString('base64url') : ''
    }`;

/**
 * Generates a link to view a TON address in a selected blockchain explorer.
 *
 * Supports several TON explorers like TONSCan, Tonviewer, dton.io, etc., and
 * dynamically adds the testnet prefix when needed.
 *
 * @param {string} address - The TON address to view in explorer.
 * @param {string} network - The target network, either 'mainnet' or 'testnet'.
 * @param {string} explorer - The desired explorer. Supported values: 'tonscan', 'tonviewer', 'toncx', 'dton'.
 * @returns {string} A full URL pointing to the address in the selected explorer.
 *
 * @example
 * const link = getExplorerLink("EQC...", "testnet", "tonscan");
 * // "https://testnet.tonscan.org/address/EQC..."
 */
export function getExplorerLink(address: string, network: string, explorer: Explorer) {
    const networkPrefix = network === 'testnet' ? 'testnet.' : '';

    switch (explorer) {
        case 'tonscan':
            return `https://${networkPrefix}tonscan.org/address/${address}`;

        case 'toncx':
            return `https://${networkPrefix}ton.cx/address/${address}`;

        case 'dton':
            return `https://${networkPrefix}dton.io/a/${address}`;

        case 'tonviewer':
        default:
            return `https://${networkPrefix}tonviewer.com/${address}`;
    }
}

export function getTransactionLink(
    tx: { lt: string | bigint; hash: Buffer; address: Address; now: number },
    network: string,
    explorer: Explorer,
) {
    const networkPrefix = network === 'testnet' ? 'testnet.' : '';

    switch (explorer) {
        case 'tonscan':
            return `https://${networkPrefix}tonscan.org/tx/${tx.hash.toString('hex')}`;
        case 'toncx':
            return `https://${networkPrefix}ton.cx/tx/${tx.lt}:${tx.hash.toString('hex')}:${tx.address}`;

        case 'dton':
            return `https://${networkPrefix}dton.io/tx/${tx.hash.toString('hex')}?time=${tx.now}`;

        case 'tonviewer':
        default:
            return `https://${networkPrefix}tonviewer.com/transaction/${tx.hash.toString('hex')}`;
    }
}

/**
 * Generates a normalized hash of an "external-in" message for comparison.
 *
 * This function ensures consistent hashing of external-in messages by following [TEP-467](https://github.com/ton-blockchain/TEPs/blob/8b3beda2d8611c90ec02a18bec946f5e33a80091/text/0467-normalized-message-hash.md):
 *
 * @param {Message} message - The message to be normalized and hashed. Must be of type `"external-in"`.
 * @returns {Buffer} The hash of the normalized message.
 * @throws {Error} if the message type is not `"external-in"`.
 */
export function getNormalizedExtMessageHash(message: Message) {
    if (message.info.type !== 'external-in') {
        throw new Error(`Message must be "external-in", got ${message.info.type}`);
    }

    const info = { ...message.info, src: undefined, importFee: 0n };

    const normalizedMessage = {
        ...message,
        init: null,
        info: info,
    };

    return beginCell()
        .store(storeMessage(normalizedMessage, { forceRef: true }))
        .endCell()
        .hash();
}
