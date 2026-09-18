import { getTestArgs } from './test';

type TestCommandArgs = Parameters<typeof getTestArgs>[0];

const commandArgs = (...args: string[]) => ({ _: ['test', ...args] }) as TestCommandArgs;

describe('getTestArgs', () => {
    it('removes Blueprint flags without depending on their position', () => {
        expect(getTestArgs(commandArgs('--gas-report', 'Counter', '--ui'))).toEqual(['Counter']);
        expect(getTestArgs(commandArgs('Counter', '--gas-report', '--ui'))).toEqual(['Counter']);
    });
});
