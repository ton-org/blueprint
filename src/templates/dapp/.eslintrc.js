module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['plugin:react/recommended', 'plugin:prettier/recommended'],
	parser: '@typescript-eslint/parser',
	plugins: ['react', 'react-hooks', '@typescript-eslint'],
	ignorePatterns: ['./docs/*'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
