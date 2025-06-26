import { SourceResolver, SourcesArray, SourcesMap } from '@ton-community/func-js';

export type FuncCompilerConfig = {
    lang?: 'func';
    optLevel?: number;
    debugInfo?: boolean;
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
