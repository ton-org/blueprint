import arg from 'arg';

import { UIProvider } from '../ui/UIProvider';
import { Config } from '../config/Config';

export const argSpec = {};

export type Args = arg.Result<typeof argSpec>;

export function extractPosArg(args: Args, position: number) {
    return args._.length > position && args._[position].trim().length > 0 ? args._[position].trim() : undefined;
}

export function extractSecondArg(args: Args) {
    return extractPosArg(args, 2);
}

export function extractFirstArg(args: Args) {
    return extractPosArg(args, 1);
}

export type RunnerContext = {
    config?: Config;
};

export type Runner = (args: Args, ui: UIProvider, context: RunnerContext) => Promise<void>;
