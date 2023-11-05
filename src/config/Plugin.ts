import { Runner } from '../cli/Runner';

export interface PluginRunner {
    name: string;
    runner: Runner;
    help: string;
}

export interface Plugin {
    runners(): PluginRunner[];
}
