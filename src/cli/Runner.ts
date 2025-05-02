import arg from 'arg';
import { UIProvider } from '../ui/UIProvider';
import { Config } from '../config/Config';

export const argSpec = {};

export type Args = arg.Result<typeof argSpec>;

export function extractFirstArg(args: Args) {
    return args._.length > 1 && args._[1].trim().length > 0 ? args._[1].trim() : undefined
}

export type RunnerContext = {
    config?: Config;
};

export type Runner = (args: Args, ui: UIProvider, context: RunnerContext) => Promise<void>;
