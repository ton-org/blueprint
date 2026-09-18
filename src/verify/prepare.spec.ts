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
            lang: 'tolk',
            code: beginCell().endCell(),
            fiftCode: '',
            stderr: '',
            version: '1.2.0',
            snapshot: [
                { filename: 'contracts/Main.tolk', content: 'tolk 1.0' },
                { filename: 'contracts/main.tolk', content: 'tolk 1.0' },
            ],
        };

        expect(() => prepareVerification(result)).toThrow('duplicate source paths');
    });

    it('rejects mismatching and repeated source extensions', () => {
        const result: CompileResult = {
            lang: 'tolk',
            code: beginCell().endCell(),
            fiftCode: '',
            stderr: '',
            version: '1.2.0',
            snapshot: [{ filename: 'contracts/main.fc', content: 'tolk 1.0' }],
        };

        expect(() => prepareVerification(result)).toThrow('does not match tolk');
        result.snapshot[0].filename = 'contracts/main.fc.tolk';
        expect(() => prepareVerification(result)).toThrow('multiple source extensions');
    });

    it('uses the first Tolk snapshot file as the entrypoint', () => {
        const result: CompileResult = {
            lang: 'tolk',
            code: beginCell().endCell(),
            fiftCode: '',
            stderr: '',
            version: '1.2.0',
            snapshot: [
                { filename: 'contracts/main.tolk', content: 'tolk 1.0' },
                { filename: 'contracts/imported.tolk', content: 'tolk 1.0' },
            ],
        };

        const prepared = prepareVerification(result, '1.2.1');

        expect(prepared.compileParams).toEqual({ compiler_version: '1.2.1' });
        expect(prepared.files.map((file) => file.source.is_entrypoint)).toEqual([true, false]);
    });

    it('rejects unsupported Tolk compiler settings', () => {
        const result: CompileResult = {
            lang: 'tolk',
            code: beginCell().endCell(),
            fiftCode: '',
            stderr: '',
            version: '1.2.0',
            optimizationLevel: 1,
            snapshot: [{ filename: 'contracts/main.tolk', content: 'tolk 1.0' }],
        };

        expect(() => prepareVerification(result)).toThrow('does not support Tolk optimizationLevel 1');
        result.optimizationLevel = 2;
        result.experimentalOptions = 'some-feature';
        expect(() => prepareVerification(result)).toThrow('does not support Tolk experimentalOptions');
    });

    it('uploads the Tact package emitted by the compiler', () => {
        const result: CompileResult = {
            lang: 'tact',
            code: beginCell().endCell(),
            version: '1.6.13',
            fs: new Map([
                ['build/Counter.code.boc', Buffer.from('boc')],
                ['build/Counter.pkg', Buffer.from('{"compiler":{"version":"1.6.13"}}')],
            ]),
        };

        const prepared = prepareVerification(result);

        expect(prepared.files).toHaveLength(1);
        expect(prepared.files[0].source).toEqual({
            path: 'build/Counter.pkg',
            is_entrypoint: false,
            include_in_command: true,
            is_stdlib: false,
            has_include_directives: false,
        });
    });

    it('rejects Tact compilation results without a package', () => {
        const result: CompileResult = {
            lang: 'tact',
            code: beginCell().endCell(),
            version: '1.6.13',
            fs: new Map([['build/Counter.code.boc', Buffer.from('boc')]]),
        };

        expect(() => prepareVerification(result)).toThrow('Could not find .pkg');
    });
});
