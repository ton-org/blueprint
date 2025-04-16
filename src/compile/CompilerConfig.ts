import { SourceResolver, SourcesMap, SourcesArray } from '@ton-community/func-js';
import { Cell } from '@ton/core';
import { Options } from '@tact-lang/compiler';

export type HookParams = {
    userData?: any;
};

export type CommonCompilerConfig = {
    preCompileHook?: (params: HookParams) => Promise<void>;
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
