import { SourceResolver, SourcesMap, SourcesArray } from '@ton-community/func-js';

export type TactCompilerConfig = {
    lang: 'tact';
    target: string;
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

export type CompilerConfig = TactCompilerConfig | FuncCompilerConfig;
