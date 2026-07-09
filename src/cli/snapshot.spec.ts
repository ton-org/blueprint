import { getSnapshotTestArgs } from './snapshot';

type SnapshotCommandArgs = Parameters<typeof getSnapshotTestArgs>[0];

const commandArgs = (...args: string[]) => ({ _: ['snapshot', ...args] }) as SnapshotCommandArgs;

describe('getSnapshotTestArgs', () => {
    it('removes the label option without depending on its position', () => {
        expect(getSnapshotTestArgs(commandArgs('Counter', '--label', 'baseline'))).toEqual(['Counter']);
        expect(getSnapshotTestArgs(commandArgs('--label=baseline', 'Counter'))).toEqual(['Counter']);
    });
});
