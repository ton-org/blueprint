import fs from 'fs/promises';

export type ParamInfo = { type: string; defaultValue: string | undefined };
export type Parameters = Record<string, ParamInfo>;

export async function parseMethodArguments(filePath: string, methodName: string): Promise<Parameters | null> {
    const content = await fs.readFile(filePath, 'utf-8');

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
                    const defaultValue =
                        defaultValueStartIndex !== -1 ? arg.slice(defaultValueStartIndex + 1).trim() : undefined;
                    parameters[argDeclaration] = { type: argType, defaultValue };
                }
            }
        }
    }

    return parameters;
}
