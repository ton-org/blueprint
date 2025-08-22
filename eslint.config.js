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
            'no-console': 'off',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error'],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['src/jest/**/*.ts', 'src/jest/**/*.tsx'],
        env: {
            jest: true,
            node: true,
        },
    },
];
