import { Address, Cell } from '@ton/core';

export const tonDeepLink = (address: Address, amount: bigint, body?: Cell, stateInit?: Cell) =>
    `ton://transfer/${address.toString({
        urlSafe: true,
        bounceable: true,
    })}?amount=${amount.toString()}${body ? '&bin=' + body.toBoc().toString('base64url') : ''}${
        stateInit ? '&init=' + stateInit.toBoc().toString('base64url') : ''
    }`;

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

export function getExplorerTxLink(txHash: string, network: string, explorer: string) {
    const networkPrefix = network === 'testnet' ? 'testnet.' : '';
    switch (explorer) {
        case 'tonscan':
            return `https://${networkPrefix}tonscan.org/tx/${txHash}`;
        case 'tonviewer':
            return `https://${networkPrefix}tonviewer.com/transaction/${txHash}`;
        case 'toncx':
            return `https://${networkPrefix}ton.cx/tx/${txHash}`;
        case 'dton':
            return `https://${networkPrefix}dton.io/tx/${txHash}`;
        default:
            return '';
    }
}
