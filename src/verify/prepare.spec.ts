import { beginCell } from '@ton/core';

import type { CompileResult } from '../compile/compile';
import { prepareVerification } from './prepare';

describe('prepareVerification', () => {
    it('marks FunC targets and standard library sources', () => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/main.fc'],
            version: '0.4.6',
            snapshot: [
                { filename: 'contracts/main.fc', content: '#include "@stdlib/stdlib.fc";' },
                { filename: '@stdlib/stdlib.fc', content: '() accept_message() asm "ACCEPT";' },
            ],
        };

        const prepared = prepareVerification(result);

        expect(prepared.compileParams).toEqual({ compiler_version: '0.4.6' });
        expect(prepared.files.map((file) => file.source)).toEqual([
            {
                path: 'contracts/main.fc',
                is_entrypoint: true,
                include_in_command: true,
                is_stdlib: false,
                has_include_directives: true,
            },
            {
                path: '@stdlib/stdlib.fc',
                is_entrypoint: false,
                include_in_command: false,
                is_stdlib: true,
                has_include_directives: true,
            },
        ]);
    });

    it('marks only the first FunC target as the entrypoint', () => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/first.fc', 'contracts/second.fc'],
            version: '0.4.6',
            snapshot: [
                { filename: 'contracts/first.fc', content: '() first() {}' },
                { filename: 'contracts/second.fc', content: '() second() {}' },
            ],
        };

        const prepared = prepareVerification(result);

        expect(prepared.files.map((file) => file.source.is_entrypoint)).toEqual([true, false]);
        expect(prepared.files.map((file) => file.source.include_in_command)).toEqual([true, true]);
    });

    it('rejects a non-default FunC optimization level', () => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/main.fc'],
            version: '0.4.6',
            optLevel: 1,
            snapshot: [{ filename: 'contracts/main.fc', content: '() recv_internal() {}' }],
        };

        expect(() => prepareVerification(result)).toThrow('does not support FunC optLevel 1');
        result.optLevel = 2;
        expect(() => prepareVerification(result)).not.toThrow();
    });

    it('rejects case-insensitive duplicate source paths', () => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/main.fc'],
            version: '0.4.6',
            snapshot: [
                { filename: 'contracts/Main.fc', content: '() recv_internal() {}' },
                { filename: 'contracts/main.fc', content: '() recv_internal() {}' },
            ],
        };

        expect(() => prepareVerification(result)).toThrow('duplicate source paths');
    });

    it.each(['txt', 'tolk'])('rejects mismatching .%s and repeated source extensions', (extension) => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/main.fc'],
            version: '0.4.6',
            snapshot: [{ filename: `contracts/main.${extension}`, content: '() recv_internal() {}' }],
        };

        expect(() => prepareVerification(result)).toThrow('does not match func');
        result.snapshot[0].filename = 'contracts/main.fc.func';
        expect(() => prepareVerification(result)).toThrow('multiple source extensions');
    });

    it('uses the FunC target as the entrypoint and overrides the compiler version', () => {
        const result: CompileResult = {
            lang: 'func',
            code: beginCell().endCell(),
            fiftCode: '',
            targets: ['contracts/main.fc'],
            version: '0.4.5',
            snapshot: [
                { filename: 'contracts/imported.fc', content: '() helper() {}' },
                { filename: 'contracts/main.fc', content: '() recv_internal() {}' },
            ],
        };

        const prepared = prepareVerification(result, '0.4.6');

        expect(prepared.compileParams).toEqual({ compiler_version: '0.4.6' });
        expect(prepared.files.map((file) => file.source.is_entrypoint)).toEqual([false, true]);
    });

    it.each(['tact', 'tolk', 'unknown'])('rejects unsupported compiler language %s', (lang) => {
        const result = { lang } as unknown as CompileResult;

        expect(() => prepareVerification(result)).toThrow(`Unsupported compiler language: ${lang}`);
    });
});
