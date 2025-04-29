import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
export type CommandType = 'install' | 'run' | 'test' | 'view';

// Cache the detected package manager
let detectedPackageManager: PackageManager | null = null;

/**
 * Detects the package manager used in the current project.
 * Prioritizes npm_config_user_agent, then checks for lock files.
 */
export function detectPackageManager(): PackageManager {
    if (detectedPackageManager) {
        return detectedPackageManager;
    }

    // 1. Check npm_config_user_agent
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent) {
        const pm = userAgent.split(' ')[0].split('/')[0];
        if (pm === 'yarn' || pm === 'pnpm' || pm === 'bun') {
            detectedPackageManager = pm;
            return pm;
        }
         if (pm === 'npm') {
            detectedPackageManager = pm;
            return pm;
        }
    }

    // 2. Check for lock files (fallback)
    const CWD = process.cwd();
    if (existsSync(path.join(CWD, 'yarn.lock'))) {
        detectedPackageManager = 'yarn';
        return 'yarn';
    }
    if (existsSync(path.join(CWD, 'pnpm-lock.yaml'))) {
        detectedPackageManager = 'pnpm';
        return 'pnpm';
    }
     if (existsSync(path.join(CWD, 'bun.lockb'))) {
        detectedPackageManager = 'bun';
        return 'bun';
    }

    // Default to npm
    detectedPackageManager = 'npm';
    return 'npm';
}

/**
 * Runs a package manager command synchronously.
 * @param command The type of command to run ('install', 'run', 'test', 'view').
 * @param args Arguments for the command.
 * @param options Options for spawnSync.
 * @returns The result of spawnSync.
 */
export function runCommand(
    command: CommandType,
    args: string[],
    options?: SpawnSyncOptions
): SpawnSyncReturns<string | Buffer> {
    const pm = detectPackageManager();
    let effectiveArgs: string[] = [];

    switch (command) {
        case 'install':
            // Note: 'install' semantics might differ slightly. This uses the basic install command.
            // For adding specific packages, a different command type might be needed.
            effectiveArgs = pm === 'yarn' ? ['install'] : ['install']; // yarn install, npm/pnpm/bun install
            effectiveArgs.push(...args); // Append any extra args like --save-dev
            break;
        case 'run':
            effectiveArgs = ['run', ...args]; // npm run ..., yarn run ..., pnpm run ..., bun run ...
            break;
        case 'test':
            effectiveArgs = ['test', ...args]; // npm test ..., yarn test ..., pnpm test ..., bun test ...
            break;
        case 'view':
            // Note: Command and JSON output support might vary.
            // yarn info <pkg> versions --json
            // npm view <pkg> versions --json
            // pnpm view <pkg> versions --json (Check if --json is supported)
            // bun ?? (bun pm versions <pkg> doesn't seem to have json output yet) - Falling back to npm for bun view
             if (pm === 'yarn') {
                 effectiveArgs = ['info', ...args]; // yarn info expects slightly different args structure
             } else if (pm === 'bun') {
                 // Bun's view equivalent lacks JSON output, using npm as fallback for now
                 console.warn("Warning: 'bun view' equivalent with JSON output not available, using 'npm view' as fallback.");
                 return spawnSync('npm', ['view', ...args], { stdio: 'pipe', ...options, cwd: options?.cwd ?? process.cwd(), shell: true });
             }
              else {
                 effectiveArgs = ['view', ...args];
             }
            break;
        default:
            throw new Error(`Unsupported command type: ${command}`);
    }

    const defaultOptions: SpawnSyncOptions = {
        stdio: 'inherit', // Default to inherit for visibility
        shell: true,      // Often needed for `run` scripts
        cwd: process.cwd(),
        ...options,       // Allow overriding defaults
    };

    // Ensure stdio is 'pipe' if we need to capture output (e.g., for 'view')
    if (command === 'view' && defaultOptions.stdio === 'inherit') {
        defaultOptions.stdio = 'pipe';
    }


    // console.log(`Running command: ${pm} ${effectiveArgs.join(' ')}`); // For debugging
    const result = spawnSync(pm, effectiveArgs, defaultOptions);

    // No need to cast to buffer anymore
    // if (result.stdout && typeof result.stdout === 'string') {
    //     result.stdout = Buffer.from(result.stdout);
    // }
    // if (result.stderr && typeof result.stderr === 'string') {
    //     result.stderr = Buffer.from(result.stderr);
    // }

    return result; // Return type now matches spawnSync potential output
}

/**
 * Gets the package.json key for overriding dependencies based on the package manager.
 */
export function getOverrideKey(): 'resolutions' | 'overrides' {
    const pm = detectPackageManager();
    return pm === 'yarn' ? 'resolutions' : 'overrides';
} 