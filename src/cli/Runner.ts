import arg from 'arg';
import { UIProvider } from '../ui/UIProvider';
import { Config } from '../config/Config';

export const argSpec = {};

export type Args = arg.Result<typeof argSpec>;

export type RunnerContext = {
    config?: Config;
};

export type Runner = (args: Args, ui: UIProvider, context: RunnerContext) => Promise<void>;
