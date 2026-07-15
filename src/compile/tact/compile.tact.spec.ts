import { beginCell } from '@ton/core';

import { findTactBoc } from './compile.tact';

describe('findTactBoc', () => {
    it('selects the requested contract when a project emits multiple BOCs', () => {
        const child = beginCell().storeUint(1, 1).endCell();
        const root = beginCell().storeUint(0, 1).endCell();
        const files = new Map([
            ['Root_Child.code.boc', child.toBoc()],
            ['Root_Root.code.boc', root.toBoc()],
        ]);

        expect(findTactBoc(files, 'Root').hash()).toEqual(root.hash());
    });
});
