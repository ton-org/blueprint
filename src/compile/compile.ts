import { readFileSync } from 'fs';
import path from 'path';

import { beginCell, Cell } from '@ton/core';

import { COMPILABLES_DIR, WRAPPERS_DIR } from '../paths';
import { CompilableConfig, CompilerConfig, isCompilableConfig } from './CompilerConfig';
import { getConfig } from '../config/utils';
import { doCompileFunc, FuncCompileResult, getFuncVersion, DoCompileFuncConfig } from './func/compile.func';
import { doCompileTact, TactCompileResult, getTactVersion, getTactConfigForContract } from './tact/compile.tact';
import { doCompileTolk, TolkCompileResult, getTolkVersion } from './tolk/compile.tolk';
import { findCompiles } from '../utils';

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

    return mod.compile;
}

export const COMPILE_END = '.compile.ts';

/**
 * Retrieves the compiler configuration for a specific contract.
 *
 * This function checks if a Tact configuration exists for the given contract
 * `tact.config.json`. If found, it returns that configuration. Otherwise, it falls back
 * to loading and extracting the `.compile.ts` configuration file from the appropriate
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
    const tactConfig = getTactConfigForContract(name);
    if (tactConfig) {
        return tactConfig;
    }

    const compilablesDirectory = await getCompilablesDirectory();
    const compilables = await findCompiles(compilablesDirectory);
    const compilable = compilables.find((c) => c.name === name);

    // Ensure compatibility with legacy usage like compile('subdirectory/ContractName')
    const pathToExtract = compilable?.path ?? path.join(compilablesDirectory, name + COMPILE_END);

    return extractCompilableConfig(pathToExtract);
}

export type CompileResult = TactCompileResult | FuncCompileResult | TolkCompileResult;

async function doCompileInner(name: string, config: CompilerConfig): Promise<CompileResult> {
    if (isCompilableConfig(config)) {
        if (config.lang === 'tact') {
            return await doCompileTact(config, name);
        }

        if (config.lang === 'tolk') {
            return await doCompileTolk({
                entrypointFileName: config.entrypoint,
                fsReadCallback: (path) => readFileSync(path).toString(),
                optimizationLevel: config.optimizationLevel,
                withStackComments: config.withStackComments,
                withSrcLineComments: config.withSrcLineComments,
                experimentalOptions: config.experimentalOptions,
            });
        }

        return await doCompileFunc({
            targets: config.targets,
            sources: config.sources ?? ((path: string) => readFileSync(path).toString()),
            optLevel: config.optLevel,
            debugInfo: config.debugInfo,
        } as DoCompileFuncConfig);
    }

    return await doCompileTact(config, name);
}

function getCompilerName(config: CompilerConfig): 'tact' | 'tolk' | 'func' {
    if (isCompilableConfig(config)) {
        return config.lang ?? 'func';
    }

    return 'tact';
}

async function getCompilerVersion(config: CompilerConfig): Promise<string> {
    if (isCompilableConfig(config)) {
        if (config.lang === 'tact') {
            return getTactVersion();
        }
        if (config.lang === 'tolk') {
            return getTolkVersion();
        }

        return getFuncVersion();
    }

    return getTactVersion();
}

export async function getCompilerOptions(config: CompilerConfig): Promise<{
    lang: 'tact' | 'tolk' | 'func';
    version: string;
}> {
    return {
        lang: getCompilerName(config),
        version: await getCompilerVersion(config),
    };
}

export async function doCompile(name: string, opts?: CompileOpts): Promise<CompileResult> {
    const config = await getCompilerConfigForContract(name);

    if (opts?.debugInfo && isCompilableConfig(config) && (config.lang === undefined || config.lang === 'func')) {
        config.debugInfo = true;
    }

    if ('preCompileHook' in config && config.preCompileHook !== undefined) {
        await config.preCompileHook({
            userData: opts?.hookUserData,
        });
    }

    const res = await doCompileInner(name, config);

    if ('postCompileHook' in config && config.postCompileHook !== undefined) {
        await config.postCompileHook(res.code, {
            userData: opts?.hookUserData,
        });
    }

    const buildLibrary = opts?.buildLibrary ?? ('buildLibrary' in config && config.buildLibrary === true);

    if (buildLibrary) {
        // Pack resulting code hash into library cell
        const lib_prep = beginCell().storeUint(2, 8).storeBuffer(res.code.hash()).endCell();
        res.code = new Cell({ exotic: true, bits: lib_prep.bits, refs: lib_prep.refs });
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
 * Compiles a contract using the specified configuration for `tact`, `func`, or `tolk` languages.
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

export type { TactCompileResult, TolkCompileResult, FuncCompileResult };
