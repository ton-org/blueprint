import arg from 'arg';
import { UIProvider } from '../ui/UIProvider';

export const argSpec = {};

export type Args = arg.Result<typeof argSpec>;

export type Runner = (args: Args, ui: UIProvider) => Promise<void>;
