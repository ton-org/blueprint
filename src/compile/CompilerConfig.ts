import { SourceResolver, SourcesMap, SourcesArray } from '@ton-community/func-js';
import { Cell } from 'ton-core';
import { ConfigProject } from '@tact-lang/compiler';

export type CommonCompilerConfig = {
    preCompileHook?: () => Promise<void>;
    postCompileHook?: (code: Cell) => Promise<void>;
};

export type TactCompilerConfig = {
    lang: 'tact';
    target: string;
    options?: ConfigProject['options'];
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

export type CompilerConfig = (TactCompilerConfig | FuncCompilerConfig) & CommonCompilerConfig;
