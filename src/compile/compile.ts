import { readFileSync } from 'fs';
import path from 'path';

import { beginCell, Cell } from '@ton/core';

import { COMPILABLES_DIR, WRAPPERS_DIR } from '../paths';
import { CompilableConfig, CompilerConfig } from './CompilerConfig';
import { getConfig } from '../config/utils';
import { doCompileFunc, FuncCompileResult, getFuncVersion, DoCompileFuncConfig } from './func/compile.func';
import { findCompiles } from '../utils';
import { SupportedLang } from './SupportedLang';

export async function getCompilablesDirectory(): Promise<string> {
    const config = await getConfig();
    if (config?.separateCompilables) {
        return COMPILABLES_DIR;
    }

    return WRAPPERS_DIR;
}

export function extractCompilableConfig(path: string): CompilableConfig {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path);

    if (typeof mod.compile !== 'object') {
        throw new Error(`Object 'compile' is missing`);
    }

    mod.compile.lang ??= 'func';

    if (mod.compile.lang !== 'func') {
        throw new Error(`Unsupported compiler language: ${mod.compile.lang}`);
    }

    return mod.compile;
}

export const COMPILE_END = '.compile.ts';

/**
 * Retrieves the compiler configuration for a specific contract.
 *
 * Loads and extracts the `.compile.ts` configuration file from the appropriate
 * compilables directory (`compilables/` or `wrappers/`).
 *
 * @param {string} name - The name of the contract
 *
 * @throws Error Throws if configuration is invalid or not found.
 *
 * @example
 * const config = await getCompilerConfigForContract('MyContract');
 * console.log('Compiler config:', config);
 */
export async function getCompilerConfigForContract(name: string): Promise<CompilerConfig> {
    const compilablesDirectory = await getCompilablesDirectory();
    const compilables = await findCompiles(compilablesDirectory);
    const compilable = compilables.find((c) => c.name === name);

    // Ensure compatibility with legacy usage like compile('subdirectory/ContractName')
    const pathToExtract = compilable?.path ?? path.join(compilablesDirectory, name + COMPILE_END);

    return extractCompilableConfig(pathToExtract);
}

export type CompileResult = FuncCompileResult;

async function doCompileInner(config: CompilerConfig): Promise<CompileResult> {
    return await doCompileFunc({
        targets: config.targets,
        sources: config.sources ?? ((path: string) => readFileSync(path).toString()),
        optLevel: config.optLevel,
        debugInfo: config.debugInfo,
    } as DoCompileFuncConfig);
}

export async function getCompilerOptions(config: CompilerConfig): Promise<{
    lang: SupportedLang;
    version: string;
}> {
    return {
        lang: config.lang ?? 'func',
        version: await getFuncVersion(),
    };
}

export function libraryCellFromCode(code: Cell) {
    // Pack resulting code hash into library cell
    const libPrep = beginCell().storeUint(2, 8).storeBuffer(code.hash()).endCell();
    return new Cell({ exotic: true, bits: libPrep.bits, refs: libPrep.refs });
}

export async function doCompile(name: string, opts?: CompileOpts): Promise<CompileResult> {
    const config = await getCompilerConfigForContract(name);

    if (opts?.debugInfo) {
        config.debugInfo = true;
    }

    if (config.preCompileHook !== undefined) {
        await config.preCompileHook({
            userData: opts?.hookUserData,
        });
    }

    const res = await doCompileInner(config);

    if (config.postCompileHook !== undefined) {
        await config.postCompileHook(res.code, {
            userData: opts?.hookUserData,
        });
    }

    const buildLibrary = opts?.buildLibrary ?? config.buildLibrary;

    if (buildLibrary) {
        res.code = libraryCellFromCode(res.code);
    }

    return res;
}

/**
 * Optional compilation settings, including user data passed to hooks
 */
export type CompileOpts = {
    /**
     * Any user-defined data that will be passed to both `preCompileHook` and `postCompileHook`.
     */
    hookUserData?: any;
    debugInfo?: boolean;
    buildLibrary?: boolean;
};

/**
 * Compiles a FunC contract using the specified configuration.
 *
 * This function resolves the appropriate compiler configuration for a given contract name,
 * runs any defined pre-compile and post-compile hooks, and returns the resulting compiled code
 * as a [Cell]{@link Cell}.
 *
 * @param {string} name - The name of the contract to compile. This should correspond to a
 *                        file named `<name>.compile.ts` in the `compilables` or `wrappers` directory.
 * @param {CompileOpts} [opts] - Optional compilation options, including user data passed to hooks.
 *
 * @returns {Promise<Cell>} A promise that resolves to the compiled contract code as a `Cell`.
 *
 * @example
 * import { compile } from '@ton/blueprint';
 *
 * async function main() {
 *     const codeCell = await compile('Contract');
 *     console.log('Compiled code BOC:', codeCell.toBoc().toString('base64'));
 * }
 *
 * main();
 */
export async function compile(name: string, opts?: CompileOpts): Promise<Cell> {
    const result = await doCompile(name, opts);

    return result.code;
}

export type { FuncCompileResult };
