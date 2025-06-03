import { Address, Cell } from '@ton/core';

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
export function getExplorerLink(address: string, network: string, explorer: string) {
    const networkPrefix = network === 'testnet' ? 'testnet.' : '';

    switch (explorer) {
        case 'tonscan':
            return `https://${networkPrefix}tonscan.org/address/${address}`;

        case 'tonviewer':
            return `https://${networkPrefix}tonviewer.com/${address}`;

        case 'toncx':
            return `https://${networkPrefix}ton.cx/address/${address}`;

        case 'dton':
            return `https://${networkPrefix}dton.io/a/${address}`;

        default:
            return `https://${networkPrefix}tonviewer.com/${address}`;
    }
}
