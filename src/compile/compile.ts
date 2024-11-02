import {
    compileFunc,
    CompilerConfig as FuncCompilerConfig,
    compilerVersion,
    SourcesArray,
} from '@ton-community/func-js';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { Cell } from '@ton/core';
import { BUILD_DIR, COMPILABLES_DIR, TACT_ROOT_CONFIG, WRAPPERS_DIR } from '../paths';
import { CompilerConfig, TactCompilerConfig } from './CompilerConfig';
import * as Tact from '@tact-lang/compiler';
import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';
import { getConfig } from '../config/utils';
import { TolkCompilerConfig, runTolkCompiler, getTolkCompilerVersion } from '@ton/tolk-js';

export async function getCompilablesDirectory(): Promise<string> {
    const config = await getConfig();
    if (config?.separateCompilables) {
        return COMPILABLES_DIR;
    }

    return WRAPPERS_DIR;
}

export const COMPILE_END = '.compile.ts';

async function getCompilerConfigForContract(name: string): Promise<CompilerConfig> {
    const compilablesDirectory = await getCompilablesDirectory();
    const mod = await import(path.join(compilablesDirectory, name + COMPILE_END));

    if (typeof mod.compile !== 'object') {
        throw new Error(`Object 'compile' is missing`);
    }

    return mod.compile;
}

export type SourceSnapshot = {
    filename: string;
    content: string;
};

export type TolkCompileResult = {
    lang: 'tolk';
    stderr: string;
    code: Cell;
    snapshot: SourceSnapshot[];
    version: string;
};

async function doCompileTolk(config: TolkCompilerConfig): Promise<TolkCompileResult> {
    const res = await runTolkCompiler(config);

    if (res.status === 'error') {
        throw new Error(res.message);
    }

    return {
        lang: 'tolk',
        stderr: res.stderr,
        code: Cell.fromBase64(res.codeBoc64),
        snapshot: res.sourcesSnapshot.map((e) => ({
            filename: e.filename,
            content: e.contents,
        })),
        version: await getTolkCompilerVersion(),
    };
}

export type FuncCompileResult = {
    lang: 'func';
    code: Cell;
    targets: string[];
    snapshot: SourceSnapshot[];
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
    options?: TactCompilerConfig['options'];
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

function getRootTactConfigOptionsForContract(name: string): TactCompilerConfig['options'] | undefined {
    if (!existsSync(TACT_ROOT_CONFIG)) {
        return undefined;
    }

    const config: Tact.Config = Tact.parseConfig(readFileSync(TACT_ROOT_CONFIG).toString());

    for (const project of config.projects) {
        if (project.name === name) {
            return project.options;
        }
    }

    return undefined;
}

async function doCompileTact(config: TactCompilerConfig, name: string): Promise<TactCompileResult> {
    const rootConfigOptions = getRootTactConfigOptionsForContract(name);
    const fs = new OverwritableVirtualFileSystem(process.cwd());

    const buildConfig = {
        config: {
            name: 'tact',
            path: config.target,
            output: path.join(BUILD_DIR, name),
            options: { ...rootConfigOptions, ...config.options },
        },
        stdlib: '/stdlib',
        project: fs,
    };

    const res = await Tact.build(buildConfig);

    if (!res) {
        throw new Error('Could not compile tact');
    }

    const code = findTactBoc(fs.overwrites);

    return {
        lang: 'tact',
        fs: fs.overwrites,
        code,
        options: buildConfig.config.options,
    };
}

export type CompileResult = TactCompileResult | FuncCompileResult | TolkCompileResult;

async function doCompileInner(name: string, config: CompilerConfig): Promise<CompileResult> {
    if (config.lang === 'tact') {
        return await doCompileTact(config, name);
    }

    if (config.lang === 'tolk') {
        return await doCompileTolk({
            entrypointFileName: config.entrypoint,
            fsReadCallback: (path) => readFileSync(path).toString(),
            optimizationLevel: config.optimizationLevel,
            withStackComments: config.withStackComments,
            experimentalOptions: config.experimentalOptions,
        });
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
