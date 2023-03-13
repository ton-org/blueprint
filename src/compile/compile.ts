import { compileFunc, CompilerConfig as FuncCompilerConfig } from '@ton-community/func-js';
import { readFileSync } from 'fs';
import path from 'path';
import { Cell } from 'ton-core';
import { BUILD_DIR, WRAPPERS_DIR } from '../paths';
import { CompilerConfig, TactCompilerConfig } from './CompilerConfig';
import { build } from '@tact-lang/compiler';
import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';

async function getCompilerConfigForContract(name: string): Promise<CompilerConfig> {
    require('ts-node/register');

    const mod = await import(path.join(WRAPPERS_DIR, name + '.compile.ts'));

    if (typeof mod.compile !== 'object') {
        throw new Error(`Object 'compile' is missing`);
    }

    return mod.compile;
}

export type FuncCompileResult = {
    lang: 'func';
    result: Cell;
};

async function doCompileFunc(config: FuncCompilerConfig): Promise<FuncCompileResult> {
    const cr = await compileFunc(config);

    if (cr.status === 'error') throw new Error(cr.message);

    return {
        lang: 'func',
        result: Cell.fromBase64(cr.codeBoc),
    };
}

export type TactCompileResult = {
    lang: 'tact';
    result: Map<string, Buffer>;
};

async function doCompileTact(config: TactCompilerConfig, name: string): Promise<TactCompileResult> {
    const fs = new OverwritableVirtualFileSystem();

    const res = await build({
        config: {
            name: 'tact',
            path: path.join(process.cwd(), config.target),
            output: path.join(BUILD_DIR, name),
        },
        stdlib: '/stdlib',
        project: fs,
    });

    if (!res) {
        throw new Error('Could not compile tact');
    }

    return {
        lang: 'tact',
        result: fs.overwrites,
    };
}

export type CompileResult = TactCompileResult | FuncCompileResult;

export async function doCompile(name: string): Promise<CompileResult> {
    const config = await getCompilerConfigForContract(name);

    if (config.lang === 'tact') {
        return await doCompileTact(config, name);
    }

    return await doCompileFunc({
        targets: config.targets,
        sources: config.sources ?? ((path: string) => readFileSync(path).toString()),
        optLevel: config.optLevel,
    } as FuncCompilerConfig);
}

export function compileResultToCell(result: CompileResult): Cell {
    switch (result.lang) {
        case 'func':
            return result.result;
        case 'tact':
            let buf: Buffer | undefined = undefined;
            for (const [k, v] of result.result) {
                if (k.endsWith('.code.boc')) {
                    buf = v;
                    break;
                }
            }
            if (buf === undefined) {
                throw new Error('Could not find boc in tact compilation result');
            }
            return Cell.fromBoc(buf)[0];
    }
}

export async function compile(name: string): Promise<Cell> {
    const result = await doCompile(name);

    return compileResultToCell(result);
}
