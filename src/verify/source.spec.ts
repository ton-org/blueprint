import path from 'path';

import { buildVerifyForm, normalizeVerifierSourcePath } from './source';
import type { PreparedVerification } from './source';

const windowsOnly = process.platform === 'win32' ? it : it.skip;

function preparedVerification(): PreparedVerification {
    return {
        language: 'func',
        compileParams: { compiler_version: '0.4.6' },
        files: [
            {
                source: {
                    path: 'main.fc',
                    is_entrypoint: true,
                    include_in_command: true,
                    is_stdlib: false,
                    has_include_directives: true,
                },
                content: '() recv_internal() {}',
            },
        ],
    };
}

describe('normalizeVerifierSourcePath', () => {
    it('normalizes relative and project-local absolute paths', () => {
        expect(normalizeVerifierSourcePath('./contracts/main.fc')).toBe('contracts/main.fc');
        expect(normalizeVerifierSourcePath(path.join(process.cwd(), 'contracts', 'main.fc'))).toBe('contracts/main.fc');
    });

    it('rejects paths that the verifier cannot store safely', () => {
        expect(() => normalizeVerifierSourcePath(path.resolve(process.cwd(), '..', 'main.fc'))).toThrow(
            'outside the project directory',
        );
        expect(() => normalizeVerifierSourcePath('contracts/contract name.fc')).toThrow('unsupported');
        expect(() => normalizeVerifierSourcePath('contracts/a+b.fc')).toThrow('unsupported');
        expect(() => normalizeVerifierSourcePath('contracts/../main.fc')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts/./main.fc')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts//main.fc')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts/.git/main.fc')).toThrow('reserved');
        expect(() => normalizeVerifierSourcePath('output/main.fc')).toThrow('reserved');
    });

    it('allows compiler virtual library paths required by FunC', () => {
        expect(normalizeVerifierSourcePath('@stdlib/stdlib.fc')).toBe('@stdlib/stdlib.fc');
        expect(normalizeVerifierSourcePath('@fiftlib/fift.fc')).toBe('@fiftlib/fift.fc');
        expect(() => normalizeVerifierSourcePath('@dependency/main.fc')).toThrow('unsupported');
    });

    windowsOnly('normalizes project-local Windows paths', () => {
        expect(normalizeVerifierSourcePath('C:\\Project\\contracts\\main.fc', 'c:\\project')).toBe('contracts/main.fc');
        expect(normalizeVerifierSourcePath('C:/Project/contracts\\main.fc', 'C:\\Project')).toBe('contracts/main.fc');
        expect(
            normalizeVerifierSourcePath('\\\\server\\share\\project\\contracts\\main.fc', '\\\\server\\share\\project'),
        ).toBe('contracts/main.fc');
    });

    windowsOnly('rejects Windows paths outside the project', () => {
        expect(() => normalizeVerifierSourcePath('C:\\outside\\main.fc', 'C:\\project')).toThrow(
            'outside the project directory',
        );
        expect(() => normalizeVerifierSourcePath('D:\\project\\main.fc', 'C:\\project')).toThrow(
            'outside the project directory',
        );
        expect(() =>
            normalizeVerifierSourcePath('\\\\other\\share\\project\\main.fc', '\\\\server\\share\\project'),
        ).toThrow('outside the project directory');
    });
});

describe('buildVerifyForm', () => {
    it('creates the multipart fields expected by the verifier API', () => {
        const prepared = preparedVerification();

        const form = buildVerifyForm(prepared, 'a'.repeat(64), 'EQAddress', 'b'.repeat(64));

        expect(form.get('code_hash')).toBe('a'.repeat(64));
        expect(form.get('address')).toBe('EQAddress');
        expect(form.get('tx_hash')).toBe('b'.repeat(64));
        expect(form.get('language')).toBe('func');
        expect(JSON.parse(String(form.get('compile_params')))).toEqual({ compiler_version: '0.4.6' });
        expect(JSON.parse(String(form.get('sources')))).toEqual([prepared.files[0].source]);
        expect(form.getAll('files')).toHaveLength(1);
    });

    it('omits tx_hash only when it is nullish', () => {
        const prepared = preparedVerification();

        expect(buildVerifyForm(prepared, 'a'.repeat(64), undefined, null).has('tx_hash')).toBe(false);
        expect(buildVerifyForm(prepared, 'a'.repeat(64), undefined, undefined).has('tx_hash')).toBe(false);
        expect(buildVerifyForm(prepared, 'a'.repeat(64), undefined, '').has('tx_hash')).toBe(true);
    });
});
