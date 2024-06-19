import { Runner } from './Runner';
import { execSync } from 'child_process';

export const test: Runner = async (args) => {
    const testArgs = args._.slice(1); // first argument is `test`, need to get rid of it
    execSync(`npm test ${testArgs.join(' ')}`, { stdio: 'inherit' });
};
