import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { Cell } from '@ton/core';

import { CompilerConfig } from './CompilerConfig';
import { doCompile, getCompilerOptions, libraryCellFromCode } from './compile';
import { findCompiles } from '../utils';

jest.mock('../utils', () => ({ findCompiles: jest.fn() }));
jest.mock('../config/utils', () => ({ getConfig: jest.fn() }));
jest.mock('test-contract-config', () => ({ compile: {} }), { virtual: true });

describe('compilation', () => {
    let directory: string;

    beforeAll(() => {
        directory = mkdtempSync(path.join(tmpdir(), 'blueprint-compile-'));
        writeFileSync(path.join(directory, 'main.tolk'), 'fun onInternalMessage() {}');
    });

    afterAll(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    beforeEach(() => {
        jest.mocked(findCompiles).mockResolvedValue([{ name: 'Contract', path: 'test-contract-config' }]);
    });

    it.each(['func', 'tolk'] as const)('compiles %s with hooks and library options', async (lang) => {
        let rawCode: Cell | undefined;
        const calls: string[] = [];
        const config: CompilerConfig = {
            ...(lang === 'func'
                ? { sources: [{ filename: 'main.fc', content: '() recv_internal() impure { }' }] }
                : { lang, entrypoint: path.join(directory, 'main.tolk') }),
            buildLibrary: true,
            preCompileHook: async ({ userData }) => {
                expect(userData).toBe('test-data');
                calls.push('pre');
            },
            postCompileHook: async (code, { userData }) => {
                expect(userData).toBe('test-data');
                expect(code.isExotic).toBe(false);
                rawCode = code;
                calls.push('post');
            },
        };
        jest.requireMock('test-contract-config').compile = config;

        // FunC configurations without an explicit language must still work.
        expect(await getCompilerOptions(config)).toEqual({ lang, version: expect.any(String) });

        const result = await doCompile('Contract', { hookUserData: 'test-data' });

        expect(result.lang).toBe(lang);
        expect(result.fiftCode.length).toBeGreaterThan(0);
        expect(result.snapshot.length).toBeGreaterThan(0);
        expect(calls).toEqual(['pre', 'post']);
        expect(result.code.equals(libraryCellFromCode(rawCode!))).toBe(true);

        const regular = await doCompile('Contract', { hookUserData: 'test-data', buildLibrary: false });
        expect(regular.code.isExotic).toBe(false);
        expect(regular.code.equals(rawCode!)).toBe(true);
    });

    it.each(['tact', 'unknown'])('rejects unsupported language %s before running hooks', async (lang) => {
        const preCompileHook = jest.fn();
        jest.requireMock('test-contract-config').compile = { lang, preCompileHook };

        await expect(doCompile('Contract')).rejects.toThrow(`Unsupported compiler language: ${lang}`);
        expect(preCompileHook).not.toHaveBeenCalled();
    });
});
