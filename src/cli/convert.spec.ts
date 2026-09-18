import { extractCompileStrings } from './convert';

describe('extractCompileStrings', () => {
    it('matches a final func command without a trailing newline', () => {
        expect(extractCompileStrings('func -o output.fif contract.fc')).toHaveLength(1);
    });
});
