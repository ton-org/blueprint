import { Runner } from './cli';
import { execSync } from 'child_process';

export const test: Runner = async () => {
    require('ts-node/register');

    execSync('npm test', { stdio: 'inherit' });
};
