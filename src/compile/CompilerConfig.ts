import { SourceResolver, SourcesMap, SourcesArray } from '@ton-community/func-js';
import { Cell } from '@ton/core';
import { Options } from '@tact-lang/compiler';

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

export type TactCompilerConfig = {
    lang: 'tact';
    target: string;
    options?: Options;
};

export type FuncCompilerConfig = {
    lang?: 'func';
    optLevel?: number;
} & (
    | {
          targets: string[];
          sources?: SourceResolver | SourcesMap;
      }
    | {
          targets?: string[];
          sources: SourcesArray;
      }
);

export type TolkCompilerConfig = {
    lang: 'tolk';
    entrypoint: string;
    optimizationLevel?: number;
    withStackComments?: boolean;
    experimentalOptions?: string;
};

export type CompilerConfig = (TactCompilerConfig | FuncCompilerConfig | TolkCompilerConfig) & CommonCompilerConfig;
