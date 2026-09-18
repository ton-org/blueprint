import { parseVerifyArgs } from './verify';

describe('verify arguments', () => {
    it.each(['--tonconnect', '--deeplink', '--mnemonic'])('accepts the %s wallet option', (option) => {
        expect(parseVerifyArgs(['verify', option])).toEqual(expect.objectContaining({ [option]: true }));
    });

    it.each(['--mainnet', '--testnet', '--tetra', '--custom', '--tonscan', '--tonviewer', '--toncx', '--dton'])(
        'rejects the unrelated %s option',
        (option) => {
            expect(() => parseVerifyArgs(['verify', option])).toThrow();
        },
    );
});
