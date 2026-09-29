import type { CompileResult } from '../compile/compile';
import type { FuncCompileResult } from '../compile/func/compile.func';
import type { SourceSnapshot } from '../compile/SourceSnapshot';
import { isCompilerLibrarySourcePath, normalizeVerifierSourcePath } from './source';
import type { PreparedVerification, UploadPart, VerifierSource } from './source';

type SourceOptions = Omit<VerifierSource, 'path'>;

const SOURCE_EXTENSIONS = {
    func: ['fc', 'func'],
} as const satisfies Record<CompileResult['lang'], readonly string[]>;

const KNOWN_SOURCE_EXTENSIONS = new Set<string>(Object.values(SOURCE_EXTENSIONS).flat());

function validateCompilerSettings(result: CompileResult): void {
    const optLevel = result.optLevel;
    switch (optLevel) {
        case undefined:
        case 0:
        case 2:
            break;
        default:
            throw new Error(`TON verifier does not support FunC optLevel ${optLevel}; expected the default value 2`);
    }
}

function prepareSnapshotFiles(
    snapshot: SourceSnapshot[],
    sourceOptions: (path: string) => SourceOptions,
): UploadPart[] {
    if (snapshot.length === 0) {
        throw new Error('Compiler did not return source files for verification');
    }

    const seenPaths = new Map<string, string>();
    return snapshot.map((file) => {
        const path = normalizeVerifierSourcePath(file.filename);
        const normalizedPath = path.toLowerCase();
        const existingPath = seenPaths.get(normalizedPath);
        if (existingPath !== undefined) {
            throw new Error(`Compiler returned duplicate source paths: ${existingPath}, ${path}`);
        }
        seenPaths.set(normalizedPath, path);

        return {
            source: { path, ...sourceOptions(path) },
            content: file.content,
        };
    });
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

function validateSourceExtensions(language: CompileResult['lang'], files: UploadPart[]): void {
    const allowedExtensions: readonly string[] = SOURCE_EXTENSIONS[language];
    for (const file of files) {
        const sourcePath = file.source.path;
        const filename = sourcePath.slice(sourcePath.lastIndexOf('/') + 1).toLowerCase();
        const extensions = filename.split('.').slice(1);
        const sourceExtensionCount = extensions.filter((candidate) => KNOWN_SOURCE_EXTENSIONS.has(candidate)).length;
        const extension = extensions.at(-1);

        if (sourceExtensionCount > 1) {
            throw new Error(`Source path contains multiple source extensions: ${sourcePath}`);
        }
        if (extension === undefined || !allowedExtensions.includes(extension)) {
            throw new Error(
                `Source extension does not match ${language}: ${sourcePath}; expected .${allowedExtensions.join(', .')}`,
            );
        }
    }
}

export function prepareVerification(result: CompileResult, compilerVersion?: string): PreparedVerification {
    if (result.lang !== 'func') {
        throw new Error(`Unsupported compiler language: ${String(result.lang)}`);
    }

    validateCompilerSettings(result);
    const files = prepareFuncFiles(result);
    if (files.length > 256) {
        throw new Error('TON verifier accepts at most 256 source files');
    }
    validateSourceExtensions(result.lang, files);

    return {
        language: result.lang,
        compileParams: {
            compiler_version: compilerVersion === undefined ? result.version : compilerVersion,
        },
        files,
    };
}
