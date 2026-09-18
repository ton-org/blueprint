'use strict';

const { cpSync, rmSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

rmSync('dist', { recursive: true, force: true });

const tscCommand = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const result = spawnSync(tscCommand, { stdio: 'inherit', shell: process.platform === 'win32' });

if (result.error) {
    throw result.error;
}

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

cpSync('src/templates', 'dist/templates', { recursive: true });
