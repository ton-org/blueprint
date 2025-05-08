import { Cell } from '@ton/core';
import { compileFunc, CompilerConfig, compilerVersion } from '@ton-community/func-js';

import { SourceSnapshot } from '../SourceSnapshot';

export type FuncCompileResult = {
    lang: 'func';
    fiftCode: string;
    code: Cell;
    targets: string[];
    snapshot: SourceSnapshot[];
    version: string;
};

export async function getFuncVersion(): Promise<string> {
    return (await compilerVersion()).funcVersion;
}

export async function doCompileFunc(config: CompilerConfig): Promise<FuncCompileResult> {
    const cr = await compileFunc(config);

    if (cr.status === 'error') throw new Error(cr.message);

    let targets: string[] = [];
    if (config.targets) {
        targets = config.targets;
    } else if (Array.isArray(config.sources)) {
        targets = config.sources.map((s) => s.filename);
    }

    return {
        lang: 'func',
        fiftCode: cr.fiftCode,
        code: Cell.fromBase64(cr.codeBoc),
        targets,
        snapshot: cr.snapshot,
        version: await getFuncVersion(),
    };
}

export { CompilerConfig as DoCompileFunConfig } from '@ton-community/func-js';
