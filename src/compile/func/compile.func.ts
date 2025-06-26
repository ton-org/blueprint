import { Cell } from '@ton/core';
import { compileFunc, CompilerConfig, compilerVersion, DebugInfo } from '@ton-community/func-js';

import { SourceSnapshot } from '../SourceSnapshot';

export type FuncCompileResult = {
    lang: 'func';
    fiftCode: string;
    code: Cell;
    targets: string[];
    snapshot: SourceSnapshot[];
    version: string;
    debugInfo?: DebugInfo;
    marks?: Cell;
};

export async function getFuncVersion(): Promise<string> {
    return (await compilerVersion()).funcVersion;
}

export async function doCompileFunc(config: CompilerConfig): Promise<FuncCompileResult> {
    const cr = await compileFunc(config);

    if (cr.status === 'error') {
        throw new Error(cr.message);
    }

    let targets: string[] = [];
    if (config.targets) {
        targets = config.targets;
    } else if (Array.isArray(config.sources)) {
        targets = config.sources.map((s) => s.filename);
    }

    const result: FuncCompileResult = {
        lang: 'func',
        fiftCode: cr.fiftCode,
        code: Cell.fromBase64(cr.codeBoc),
        targets,
        snapshot: cr.snapshot,
        version: await getFuncVersion(),
        debugInfo: cr.debugInfo,
        marks: cr.debugMarksBoc === undefined ? undefined : Cell.fromBase64(cr.debugMarksBoc),
    };

    if (config.debugInfo) {
        const crRegular = await compileFunc({
            ...config,
            debugInfo: false,
        });

        if (crRegular.status === 'error') {
            throw new Error(
                'Debug info compilation succeeded, but regular compilation failed, please report this bug: ' +
                    crRegular.message,
            );
        }

        if (!Cell.fromBase64(crRegular.codeBoc).hash().equals(result.code.hash())) {
            console.error(
                'Debug info compilation yielded different code than regular compilation, please report this bug.',
            );
        }

        let sandbox: any;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            sandbox = require('@ton/sandbox');
        } catch (_) {
            console.error('Could not register debug info in sandbox because it is not installed.');
        }
        if (sandbox?.registerCompiledContract) {
            sandbox.registerCompiledContract(result.code, result.debugInfo, result.marks);
        }
    }

    return result;
}

export { CompilerConfig as DoCompileFuncConfig } from '@ton-community/func-js';
