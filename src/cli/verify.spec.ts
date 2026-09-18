import { spawnSync } from 'child_process';
import path from 'path';

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

    it('exits with an error for an unsupported option', () => {
        const result = spawnSync(
            process.execPath,
            ['--require', 'ts-node/register', path.join(__dirname, 'cli.ts'), 'verify', '--mainnet', '--help'],
            { encoding: 'utf8' },
        );

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('unknown or unexpected option: --mainnet');
    });
});
