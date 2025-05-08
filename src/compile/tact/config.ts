import { Config, Options } from '@tact-lang/compiler';

export type TactLegacyCompilerConfig = {
    lang: 'tact';
    target: string;
    options?: Options;
};

export type TactCompilerConfig = Config;
