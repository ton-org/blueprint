import { beginCell } from '@ton/core';

import { CompileResult } from '../compile/compile';
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
