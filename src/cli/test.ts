import { Runner } from './Runner';
import { execSync } from 'child_process';

export const test: Runner = async () => {
    execSync('npm test', { stdio: 'inherit' });
};
