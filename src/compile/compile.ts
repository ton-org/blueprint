import { compileFunc, CompilerConfig as FuncCompilerConfig } from '@ton-community/func-js';
import { readFileSync } from 'fs';
import path from 'path';
import { Cell } from 'ton-core';
import { WRAPPERS_DIR } from '../paths';
import { CompilerConfig } from './CompilerConfig';

export async function compile(name: string) {
    require('ts-node/register');

    const mod = await import(path.join(WRAPPERS_DIR, name + '.compile.ts'));

    if (typeof mod.compile !== 'object') {
        throw new Error(`Object 'compile' is missing`);
    }

    const cc: CompilerConfig = mod.compile;

    const fcc: FuncCompilerConfig = {
        targets: cc.targets,
        sources: cc.sources ?? ((path: string) => readFileSync(path).toString()),
        optLevel: cc.optLevel,
    } as any;

    const cr = await compileFunc(fcc);

    if (cr.status === 'error') throw new Error(cr.message);

    return Cell.fromBase64(cr.codeBoc);
}
