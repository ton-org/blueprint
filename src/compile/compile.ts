import {
    compileFunc,
    compilerVersion,
    CompilerConfig as FuncCompilerConfig,
    SourcesArray,
} from '@ton-community/func-js';
import { readFileSync } from 'fs';
import path from 'path';
import { Cell } from '@ton/core';
import { BUILD_DIR, WRAPPERS_DIR } from '../paths';
import { CompilerConfig, TactCompilerConfig } from './CompilerConfig';
import { build } from '@tact-lang/compiler';
import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';

async function getCompilerConfigForContract(name: string): Promise<CompilerConfig> {
    const mod = await import(path.join(WRAPPERS_DIR, name + '.compile.ts'));

    if (typeof mod.compile !== 'object') {
        throw new Error(`Object 'compile' is missing`);
    }

    return mod.compile;
}

export type FuncCompileResult = {
    lang: 'func';
    code: Cell;
    targets: string[];
    snapshot: SourcesArray;
    version: string;
};

async function doCompileFunc(config: FuncCompilerConfig): Promise<FuncCompileResult> {
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
        code: Cell.fromBase64(cr.codeBoc),
        targets,
        snapshot: cr.snapshot,
        version: (await compilerVersion()).funcVersion,
    };
}

export type TactCompileResult = {
    lang: 'tact';
    fs: Map<string, Buffer>;
    code: Cell;
};

function findTactBoc(fs: Map<string, Buffer>): Cell {
    let buf: Buffer | undefined = undefined;
    for (const [k, v] of fs) {
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

async function doCompileTact(config: TactCompilerConfig, name: string): Promise<TactCompileResult> {
    const fs = new OverwritableVirtualFileSystem(process.cwd());

    const res = await build({
        config: {
            name: 'tact',
            path: config.target,
            output: path.join(BUILD_DIR, name),
            options: config.options,
        },
        stdlib: '/stdlib',
        project: fs,
    });

    if (!res) {
        throw new Error('Could not compile tact');
    }

    const code = findTactBoc(fs.overwrites);

    return {
        lang: 'tact',
        fs: fs.overwrites,
        code,
    };
}

export type CompileResult = TactCompileResult | FuncCompileResult;

async function doCompileInner(name: string, config: CompilerConfig): Promise<CompileResult> {
    if (config.lang === 'tact') {
        return await doCompileTact(config, name);
    }

    return await doCompileFunc({
        targets: config.targets,
        sources: config.sources ?? ((path: string) => readFileSync(path).toString()),
        optLevel: config.optLevel,
    } as FuncCompilerConfig);
}

export async function doCompile(name: string, opts?: CompileOpts): Promise<CompileResult> {
    const config = await getCompilerConfigForContract(name);

    if (config.preCompileHook !== undefined) {
        await config.preCompileHook({
            userData: opts?.hookUserData,
        });
    }

    const res = await doCompileInner(name, config);

    if (config.postCompileHook !== undefined) {
        await config.postCompileHook(res.code, {
            userData: opts?.hookUserData,
        });
    }

    return res;
}

export type CompileOpts = {
    hookUserData?: any;
};

export async function compile(name: string, opts?: CompileOpts): Promise<Cell> {
    const result = await doCompile(name, opts);

    return result.code;
}
