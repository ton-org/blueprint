import {Options} from '@tact-lang/compiler';

export type TactCompilerConfig = {
    lang: 'tact';
    target: string;
    options?: Options;
};