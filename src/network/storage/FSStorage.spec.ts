import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { FSStorage } from './FSStorage';

describe('FSStorage', () => {
    it('stores session data with private permissions', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'blueprint-storage-'));
        const filePath = path.join(directory, 'session.json');

        try {
            const storage = new FSStorage(filePath);
            await storage.setItem('key', 'value');

            expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual({ key: 'value' });
            if (process.platform !== 'win32') {
                expect((await stat(filePath)).mode & 0o777).toBe(0o600);
                expect((await stat(directory)).mode & 0o777).toBe(0o700);
            }
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
