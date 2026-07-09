import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

jest.mock('../config/utils', () => ({
    getConfig: async () => ({ recursiveWrappers: true }),
}));

import { findCompiles } from './selection.utils';

describe('findCompiles', () => {
    it('preserves nested paths when recursive wrappers are enabled', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'blueprint-compilables-'));
        const nestedDirectory = path.join(directory, 'payments');

        try {
            await mkdir(nestedDirectory, { recursive: true });
            const compilePath = path.join(nestedDirectory, 'Token.compile.ts');
            await writeFile(compilePath, 'export const compile = {}');

            await expect(findCompiles(directory)).resolves.toEqual([{ path: compilePath, name: 'payments/Token' }]);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
