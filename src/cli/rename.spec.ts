import { renameExactIfRequired } from './rename';

describe('Rename', function () {
    it('It should rename exact match', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('a a', replaces);
        expect(result.isRenamed).toStrictEqual(true);
        expect(result.newValue).toStrictEqual('b b');
    });

    it('It should not rename not exact match', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('and', replaces);
        expect(result.isRenamed).toStrictEqual(false);
        expect(result.newValue).toStrictEqual('and');
    });

    it('It should not rename another case', function () {
        const replaces = {
            a: 'b',
        };
        const result = renameExactIfRequired('A', replaces);
        expect(result.isRenamed).toStrictEqual(false);
        expect(result.newValue).toStrictEqual('A');
    });

    it('It should rename contract name in brackets', function () {
        const replaces = {
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`compile('MyContract')`, replaces);
        expect(result.isRenamed).toStrictEqual(true);
        expect(result.newValue).toStrictEqual(`compile('NotMyContract')`);
    });

    it('It should not rename contract name if not exact match', function () {
        const replaces = {
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`compile('MyContract2')`, replaces);
        expect(result.isRenamed).toStrictEqual(false);
        expect(result.newValue).toStrictEqual(`compile('MyContract2')`);
    });

    it('It should do multiple replaces', function () {
        const replaces = {
            ['myContract']: 'notMyContract',
            ['MyContract']: 'NotMyContract',
        };
        const result = renameExactIfRequired(`let myContract: MyContract;`, replaces);
        expect(result.isRenamed).toStrictEqual(true);
        expect(result.newValue).toStrictEqual(`let notMyContract: NotMyContract;`);
    });
});
