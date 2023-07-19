import fs from 'fs';

export type ParamInfo = { type: string; defaultValue: string | undefined };
export type Parameters = Record<string, ParamInfo>;

export function parseMethodArguments(filePath: string, methodName: string): Parameters | null {
	const content = fs.readFileSync(filePath, 'utf-8');

	const methodDeclaration = `async ${methodName}(`;
	const startIndex = content.indexOf(methodDeclaration);
	if (startIndex === -1) {
		throw new Error(`Method ${methodName} not found in ${filePath}`);
	}

	const startBracketIndex = startIndex + methodDeclaration.length;
	const endBracketIndex = content.indexOf(') {', startBracketIndex);
	let methodContent = content.slice(startBracketIndex, endBracketIndex);

    const returnTypeIndex = methodContent.indexOf(': Promise<');
    if (returnTypeIndex !== -1) {
        methodContent = methodContent.slice(0, returnTypeIndex - 1);
    }

	const parameterRegex = /(\w+)\s*:\s*([^=,)]+)(?:\s*=\s*((?:(?!\s*,|\)).)*?(?=\s*,|\))|\([^)]+\)))?(?:,|$)/g;

	const lines = methodContent.split('\n');
	const parameters: Parameters = {};

	for (const line of lines) {
		const trimmedLine = line.trim();
		if (!trimmedLine.startsWith('//')) {
			const args = trimmedLine.split(',');
			for (const arg of args) {
				const colonIndex = arg.indexOf(':');
				if (colonIndex !== -1) {
					const argDeclaration = arg.slice(0, colonIndex).trim();
					const defaultValueStartIndex = arg.indexOf('=');
					const argType = arg
						.slice(colonIndex + 1, defaultValueStartIndex !== -1 ? defaultValueStartIndex : undefined)
						.trim();
					const defaultValue = defaultValueStartIndex !== -1 ? arg.slice(defaultValueStartIndex + 1).trim() : undefined;
					parameters[argDeclaration] = { type: argType, defaultValue };
				}
			}
		}
	}

	return parameters;
}

// Example usage
// const filePath = './wrappers/JettonMinter.ts';
// const methodName = 'sendCreateSimpleMsgVoting';
// const args = parseMethodArguments(filePath, methodName);
// console.log(args);
