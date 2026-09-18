import path from 'path';

import { buildVerifyForm, normalizeVerifierSourcePath, PreparedVerification } from './source';

const windowsOnly = process.platform === 'win32' ? it : it.skip;

function preparedVerification(): PreparedVerification {
    return {
        language: 'tolk',
        compileParams: { compiler_version: '1.2.0' },
        files: [
            {
                source: {
                    path: 'main.tolk',
                    is_entrypoint: true,
                    include_in_command: true,
                    is_stdlib: false,
                    has_include_directives: true,
                },
                content: 'tolk 1.0',
            },
        ],
    };
}

describe('normalizeVerifierSourcePath', () => {
    it('normalizes relative and project-local absolute paths', () => {
        expect(normalizeVerifierSourcePath('./contracts/main.tolk')).toBe('contracts/main.tolk');
        expect(normalizeVerifierSourcePath(path.join(process.cwd(), 'contracts', 'main.tolk'))).toBe(
            'contracts/main.tolk',
        );
    });

    it('rejects paths that the verifier cannot store safely', () => {
        expect(() => normalizeVerifierSourcePath(path.resolve(process.cwd(), '..', 'main.tolk'))).toThrow(
            'outside the project directory',
        );
        expect(() => normalizeVerifierSourcePath('contracts/contract name.tolk')).toThrow('unsupported');
        expect(() => normalizeVerifierSourcePath('contracts/a+b.tolk')).toThrow('unsupported');
        expect(() => normalizeVerifierSourcePath('contracts/../main.tolk')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts/./main.tolk')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts//main.tolk')).toThrow('Invalid source path');
        expect(() => normalizeVerifierSourcePath('contracts/.git/main.tolk')).toThrow('reserved');
        expect(() => normalizeVerifierSourcePath('output/main.tolk')).toThrow('reserved');
    });

    it('allows compiler virtual library paths required by FunC', () => {
        expect(normalizeVerifierSourcePath('@stdlib/stdlib.fc')).toBe('@stdlib/stdlib.fc');
        expect(normalizeVerifierSourcePath('@fiftlib/fift.fc')).toBe('@fiftlib/fift.fc');
        expect(() => normalizeVerifierSourcePath('@dependency/main.fc')).toThrow('unsupported');
    });

    windowsOnly('normalizes project-local Windows paths', () => {
        expect(normalizeVerifierSourcePath('C:\\Project\\contracts\\main.tolk', 'c:\\project')).toBe(
            'contracts/main.tolk',
        );
        expect(normalizeVerifierSourcePath('C:/Project/contracts\\main.tolk', 'C:\\Project')).toBe(
            'contracts/main.tolk',
        );
        expect(
            normalizeVerifierSourcePath(
                '\\\\server\\share\\project\\contracts\\main.tolk',
                '\\\\server\\share\\project',
            ),
        ).toBe('contracts/main.tolk');
    });

    windowsOnly('rejects Windows paths outside the project', () => {
        expect(() => normalizeVerifierSourcePath('C:\\outside\\main.tolk', 'C:\\project')).toThrow(
            'outside the project directory',
        );
        expect(() => normalizeVerifierSourcePath('D:\\project\\main.tolk', 'C:\\project')).toThrow(
            'outside the project directory',
        );
        expect(() =>
            normalizeVerifierSourcePath('\\\\other\\share\\project\\main.tolk', '\\\\server\\share\\project'),
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
        expect(form.get('language')).toBe('tolk');
        expect(JSON.parse(String(form.get('compile_params')))).toEqual({ compiler_version: '1.2.0' });
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
