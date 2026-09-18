import {
    BLUEPRINT_USER_AGENT,
    BLUEPRINT_VERSION,
    DEFAULT_BLUEPRINT_VERSION,
    resolveBlueprintVersion,
} from './buildInfo.utils';

describe('build info', () => {
    it('uses the package version', () => {
        expect(resolveBlueprintVersion({ version: '1.2.3' })).toBe('1.2.3');
    });

    it.each([undefined, {}])('falls back when the package version is unavailable %#', (packageMetadata) => {
        expect(resolveBlueprintVersion(packageMetadata)).toBe(DEFAULT_BLUEPRINT_VERSION);
    });

    it('builds the user agent from the package version', () => {
        expect(BLUEPRINT_USER_AGENT).toBe(`blueprint/${BLUEPRINT_VERSION}`);
    });
});
