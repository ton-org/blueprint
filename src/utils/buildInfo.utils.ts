export const DEFAULT_BLUEPRINT_VERSION = 'unknown';

type BlueprintPackage = {
    version?: string;
};

export function resolveBlueprintVersion(packageMetadata?: BlueprintPackage): string {
    return packageMetadata?.version ?? DEFAULT_BLUEPRINT_VERSION;
}

function loadBlueprintPackage(): BlueprintPackage | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../../package.json') as BlueprintPackage;
    } catch {
        return undefined;
    }
}

export const BLUEPRINT_VERSION = resolveBlueprintVersion(loadBlueprintPackage());
export const BLUEPRINT_USER_AGENT = `blueprint/${BLUEPRINT_VERSION}`;
