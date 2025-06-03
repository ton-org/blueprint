const base = require('@ton/toolchain');
const tsEslint = require('@ton/toolchain').tsEslint;

module.exports = [
    ...base,
    { ignores: ['example/**'] },
    {
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            'import/order': 'warn',
            'no-empty': 'warn',
            'no-useless-escape': 'warn',
            'no-console': 'warn',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error'],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        files: ['src/compile/compile.ts', 'src/cli/cli.ts'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
];
