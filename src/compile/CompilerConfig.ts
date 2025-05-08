import { Cell } from '@ton/core';

import { TolkCompilerConfig } from './tolk/config';
import { FuncCompilerConfig } from './func/config';
import { TactCompilerConfig, TactLegacyCompilerConfig } from './tact/config';

export type HookParams = {
    userData?: any;
};

export type CommonCompilerConfig = {
    /**
     * A hook that runs **before** the contract is compiled.
     *
     * @param {HookParams} params - Hook parameters including user-defined data.
     *
     * @example
     * const config: CompilerConfig = {
     *     preCompileHook: async (params) => {
     *         console.log("Preparing to compile, user params:", params);
     *     }
     * };
     */
    preCompileHook?: (params: HookParams) => Promise<void>;

    /**
     * A hook that runs **after** the contract is compiled.
     *
     * @param {Cell} code - The compiled contract code as a TON `Cell`.
     * @param {HookParams} params - Hook parameters including user-defined data.
     *
     * @example
     * const config: CompilerConfig = {
     *     postCompileHook: async (code) => {
     *         console.log("Compiled BOC size:", code.toBoc().length);
     *     }
     * };
     */
    postCompileHook?: (code: Cell, params: HookParams) => Promise<void>;
};

export type CompilableConfig = (TactLegacyCompilerConfig | FuncCompilerConfig | TolkCompilerConfig) &
    CommonCompilerConfig;

export type CompilerConfig = TactCompilerConfig | CompilableConfig;

export function isCompilableConfig(config: CompilerConfig): config is CompilableConfig {
    return 'lang' in config;
}
