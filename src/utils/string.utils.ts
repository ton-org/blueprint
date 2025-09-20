export function isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

export function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, (sub) => '_' + sub.toLowerCase());
    return r[0] === '_' ? r.substring(1) : r;
}

export function toLowerCase(str: string): string {
    return str.substring(0, 1).toLowerCase() + str.substring(1);
}

export function toPascalCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Splits camelCase words into separate words
        .replace(/[^a-zA-Z0-9]+/g, ' ') // Replaces all characters that are not allowed with spaces
        .toLowerCase() // Converts the entire string to lowercase
        .replace(/(?:^|\s)(\p{L})/gu, (_, letter) => letter.toUpperCase()) // Capitalizes the first letter of each word
        .replace(/\s+/g, ''); // Removes all spaces
}

export function validateContractName(name: string): string | undefined {
    if (name.length === 0) return `Contract name cannot be empty.`;

    if (name.toLowerCase() === 'contract') {
        return `Contract name 'contract' is reserved. Please choose a different name.`;
    }

    if (!isPascalCase(name)) {
        return `Contract name '${name}' is not in PascalCase. Please try ${toPascalCase(name)}.`;
    }

    return undefined;
}
