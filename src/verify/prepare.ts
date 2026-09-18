import { CompileResult } from '../compile/compile';
import { FuncCompileResult } from '../compile/func/compile.func';
import { SourceSnapshot } from '../compile/SourceSnapshot';
import { TactCompileResult } from '../compile/tact/compile.tact';
import { TolkCompileResult } from '../compile/tolk/compile.tolk';
import {
    isCompilerLibrarySourcePath,
    normalizeVerifierSourcePath,
    PreparedVerification,
    UploadPart,
    VerifierSource,
} from './source';

type SourceOptions = Omit<VerifierSource, 'path'>;

function prepareSnapshotFiles(
    snapshot: SourceSnapshot[],
    sourceOptions: (path: string, index: number) => SourceOptions,
): UploadPart[] {
    if (snapshot.length === 0) {
        throw new Error('Compiler did not return source files for verification');
    }

    const seenPaths = new Set<string>();
    return snapshot.map((file, index) => {
        const path = normalizeVerifierSourcePath(file.filename);
        if (seenPaths.has(path)) {
            throw new Error(`Compiler returned duplicate source path: ${path}`);
        }
        seenPaths.add(path);

        return {
            source: { path, ...sourceOptions(path, index) },
            content: file.content,
        };
    });
}

function prepareTactFiles(result: TactCompileResult): UploadPart[] {
    const pkg = Array.from(result.fs.entries()).find(([filename]) => filename.endsWith('.pkg'));
    if (pkg === undefined) {
        throw new Error('Could not find .pkg in Tact compilation results');
    }
    const [packagePath, packageContent] = pkg;

    return [
        {
            source: {
                path: normalizeVerifierSourcePath(packagePath),
                is_entrypoint: false,
                include_in_command: true,
                is_stdlib: false,
                has_include_directives: false,
            },
            content: packageContent,
        },
    ];
}

function prepareFuncFiles(result: FuncCompileResult): UploadPart[] {
    const targetPaths = result.targets.map((target) => normalizeVerifierSourcePath(target));
    const targets = new Set(targetPaths);
    const entrypoint = targetPaths[0];
    if (entrypoint === undefined) {
        throw new Error('Compiler did not return FunC targets for verification');
    }

    return prepareSnapshotFiles(result.snapshot, (path) => {
        const isTarget = targets.has(path);
        return {
            is_entrypoint: path === entrypoint,
            include_in_command: isTarget,
            is_stdlib: isCompilerLibrarySourcePath(path),
            has_include_directives: true,
        };
    });
}

function prepareTolkFiles(result: TolkCompileResult): UploadPart[] {
    return prepareSnapshotFiles(result.snapshot, (path, index) => ({
        is_entrypoint: index === 0,
        include_in_command: true,
        is_stdlib: isCompilerLibrarySourcePath(path),
        has_include_directives: true,
    }));
}

function prepareFiles(result: CompileResult): UploadPart[] {
    switch (result.lang) {
        case 'tact':
            return prepareTactFiles(result);
        case 'func':
            return prepareFuncFiles(result);
        case 'tolk':
            return prepareTolkFiles(result);
        default: {
            const unsupportedResult: never = result;
            const language = (unsupportedResult as { lang?: unknown }).lang;
            throw new Error(`Unsupported compiler language: ${String(language)}`);
        }
    }
}

export function prepareVerification(result: CompileResult, compilerVersion?: string): PreparedVerification {
    const files = prepareFiles(result);
    if (files.length > 256) {
        throw new Error('TON verifier accepts at most 256 source files');
    }

    return {
        language: result.lang,
        compileParams: {
            compiler_version: compilerVersion === undefined ? result.version : compilerVersion,
        },
        files,
    };
}
