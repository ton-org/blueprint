import { SourceResolver, SourcesArray, SourcesMap } from '@ton-community/func-js';

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
