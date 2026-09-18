import path from 'path';

import { CompileResult } from '../compile/compile';

export type VerifierSource = {
    path: string;
    is_entrypoint: boolean;
    include_in_command?: boolean;
    is_stdlib?: boolean;
    has_include_directives?: boolean;
};

export type UploadPart = {
    source: VerifierSource;
    content: string | Buffer;
};

export type PreparedVerification = {
    language: CompileResult['lang'];
    compileParams: {
        compiler_version: string;
    };
    files: UploadPart[];
};

function isInvalidSourcePathComponent(component: string): boolean {
    return component === '' || component === '..' || component.endsWith('.');
}

export function isCompilerLibrarySourcePath(sourcePath: string): boolean {
    return sourcePath.startsWith('@stdlib/') || sourcePath.startsWith('@fiftlib/');
}

export function normalizeVerifierSourcePath(filename: string, projectRoot: string = process.cwd()): string {
    const slashPath = filename.replace(/\\/g, '/');
    const normalizedRoot = projectRoot.replace(/\\/g, '/').replace(/\/+$/, '');
    let relativePath = slashPath;

    if (path.posix.isAbsolute(slashPath)) {
        if (slashPath !== normalizedRoot && !slashPath.startsWith(`${normalizedRoot}/`)) {
            throw new Error(`Source file is outside the project directory and cannot be verified: ${filename}`);
        }
        relativePath = slashPath.slice(normalizedRoot.length).replace(/^\/+/, '');
    }

    relativePath = relativePath.replace(/^\.\//, '');
    const components = relativePath.split('/');
    if (components.some(isInvalidSourcePathComponent)) {
        throw new Error(`Invalid source path for TON verifier: ${filename}`);
    }

    const normalized = components.join('/');
    if (normalized.length > 128) {
        throw new Error(`Source path is longer than 128 characters: ${normalized}`);
    }
    const portablePath = isCompilerLibrarySourcePath(normalized) ? normalized.slice(1) : normalized;
    if (!/^[A-Za-z0-9/._-]+$/.test(portablePath)) {
        throw new Error(`Source path contains characters unsupported by TON verifier: ${normalized}`);
    }
    if (components.some((component) => component.toLowerCase() === '.git')) {
        throw new Error(`Source path contains the reserved .git directory: ${normalized}`);
    }
    if (components[0].toLowerCase() === 'output') {
        throw new Error(`Source path contains the reserved output directory: ${normalized}`);
    }

    return normalized;
}

export function buildVerifyForm(
    prepared: PreparedVerification,
    codeHash: string,
    address?: string,
    paymentTransactionHash?: string | null,
): FormData {
    const form = new FormData();
    form.append('code_hash', codeHash);
    if (address) {
        form.append('address', address);
    }
    if (paymentTransactionHash !== null && paymentTransactionHash !== undefined) {
        form.append('tx_hash', paymentTransactionHash);
    }
    form.append('language', prepared.language);
    form.append('compile_params', JSON.stringify(prepared.compileParams));
    form.append('sources', JSON.stringify(prepared.files.map((file) => file.source)));

    for (const file of prepared.files) {
        form.append('files', new Blob([file.content]), file.source.path);
    }

    return form;
}
