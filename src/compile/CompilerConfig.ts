import {SourceResolver, SourcesMap, SourcesArray} from '@ton-community/func-js'

export type CompilerConfig = {
    optLevel?: number
} & (
    | {
          targets: string[]
          sources?: SourceResolver | SourcesMap
      }
    | {
          targets?: string[]
          sources: SourcesArray
      }
)
