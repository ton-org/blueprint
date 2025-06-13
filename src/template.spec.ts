import { executeTemplate } from './template';

describe('template', () => {
    it('simple template', async () => {
        const actual = executeTemplate('foo {{bar}}', { bar: 'baz' });
        expect(actual).toEqual('foo baz');
    });
});
