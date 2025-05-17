import path from 'path';

export const CONTRACTS = 'contracts';
export const TESTS = 'tests';
export const COMPILABLES = 'compilables';
export const WRAPPERS = 'wrappers';
export const SCRIPTS = 'scripts';
export const TEMP = 'temp';
export const BUILD = 'build';

export const COMPILABLES_DIR = path.join(process.cwd(), COMPILABLES);
export const WRAPPERS_DIR = path.join(process.cwd(), WRAPPERS);
export const SCRIPTS_DIR = path.join(process.cwd(), SCRIPTS);
export const BUILD_DIR = path.join(process.cwd(), BUILD);
export const TEMP_DIR = path.join(process.cwd(), TEMP);
export const CONTRACTS_DIR = path.join(process.cwd(), CONTRACTS);
export const TESTS_DIR = path.join(process.cwd(), TESTS);

export const PACKAGE_ENTRY_POINT = path.join(process.cwd(), 'package.ts');
export const BLUEPRINT_CONFIG = path.join(process.cwd(), 'blueprint.config.ts');
export const TACT_ROOT_CONFIG = path.join(process.cwd(), 'tact.config.json');
export const TYPESCRIPT_CONFIG = path.join(process.cwd(), 'tsconfig.json');
export const PACKAGE_JSON = path.join(process.cwd(), 'package.json');
