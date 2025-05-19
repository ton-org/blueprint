import { describe, it } from 'node:test';
import assert from 'node:assert';

import { renameExactIfRequired } from './rename';

describe('Rename', function () {
    it('It should rename exact match', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('a a', replaces);
        assert.strictEqual(result.isRenamed, true);
        assert.strictEqual(result.newValue, 'b b');
    });

    it('It should not rename not exact match', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('and', replaces);
        assert.strictEqual(result.isRenamed, false);
        assert.strictEqual(result.newValue, 'and');
    });

    it('It should not rename another case', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('A', replaces);
        assert.strictEqual(result.isRenamed, false);
        assert.strictEqual(result.newValue, 'A');
    });

    it('It should rename contract name in brackets', function () {
        const replaces = {
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`compile('MyContract')`, replaces);
        assert.strictEqual(result.isRenamed, true);
        assert.strictEqual(result.newValue, `compile('NotMyContract')`);
    });

    it('It should not rename contract name if not exact match', function () {
        const replaces = {
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`compile('MyContract2')`, replaces);
        assert.strictEqual(result.isRenamed, false);
        assert.strictEqual(result.newValue, `compile('MyContract2')`);
    });

    it('It should do multiple replaces', function () {
        const replaces = {
            ['myContract']: 'notMyContract',
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`let myContract: MyContract;`, replaces);
        assert.strictEqual(result.isRenamed, true);
        assert.strictEqual(result.newValue, `let notMyContract: NotMyContract;`);
    });
});
