import { Cell } from '@ton/core';

import { CompilerConfig } from './CompilerConfig';
import { doCompile, getCompilerOptions, libraryCellFromCode } from './compile';
import { findCompiles } from '../utils';

jest.mock('../utils', () => ({ findCompiles: jest.fn() }));
jest.mock('../config/utils', () => ({ getConfig: jest.fn() }));
jest.mock('test-contract-config', () => ({ compile: {} }), { virtual: true });

describe('compilation', () => {
    beforeEach(() => {
        jest.mocked(findCompiles).mockResolvedValue([{ name: 'Contract', path: 'test-contract-config' }]);
    });

    it.each([undefined, 'func'] as const)('compiles FunC with lang=%s, hooks and library options', async (lang) => {
        let rawCode: Cell | undefined;
        const calls: string[] = [];
        const config: CompilerConfig = {
            lang,
            sources: [{ filename: 'main.fc', content: '() recv_internal() impure { }' }],
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
        expect(await getCompilerOptions(config)).toEqual({ lang: 'func', version: expect.any(String) });

        const result = await doCompile('Contract', { hookUserData: 'test-data' });

        expect(result.lang).toBe('func');
        expect(result.fiftCode.length).toBeGreaterThan(0);
        expect(result.snapshot.length).toBeGreaterThan(0);
        expect(calls).toEqual(['pre', 'post']);
        expect(result.code.equals(libraryCellFromCode(rawCode!))).toBe(true);

        const regular = await doCompile('Contract', { hookUserData: 'test-data', buildLibrary: false });
        expect(regular.code.isExotic).toBe(false);
        expect(regular.code.equals(rawCode!)).toBe(true);
    });

    it.each(['tact', 'tolk', 'unknown'])('rejects unsupported language %s before running hooks', async (lang) => {
        const preCompileHook = jest.fn();
        jest.requireMock('test-contract-config').compile = { lang, preCompileHook };

        await expect(doCompile('Contract')).rejects.toThrow(`Unsupported compiler language: ${lang}`);
        expect(preCompileHook).not.toHaveBeenCalled();
    });
});
