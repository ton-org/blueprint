export function isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}


export function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, (sub) => '_' + sub.toLowerCase());
    return r[0] === '_' ? r.substring(1) : r;
}

export function toLowerCase(str: string): string {
    return str.substring(0, 1).toLowerCase() + str.substring(1)
}

export function toPascalCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Splits camelCase words into separate words
        .replace(/[^a-zA-Z0-9]+/g, ' ') // Replaces all characters that are not allowed with spaces
        .toLowerCase() // Converts the entire string to lowercase
        .replace(/(?:^|\s)(\p{L})/gu, (_, letter) => letter.toUpperCase()) // Capitalizes the first letter of each word
        .replace(/\s+/g, ''); // Removes all spaces
}

export function assertValidContractName(name: string) {
    if (name.length === 0) throw new Error(`Contract name cannot be empty.`);

    if (name.toLowerCase() === 'contract') {
        throw new Error(`Contract name 'contract' is reserved. Please choose a different name.`);
    }

    if (!isPascalCase(name)) {
        throw new Error(`Contract name '${name}' is not in PascalCase. Please try ${toPascalCase(name)}.`);
    }
}