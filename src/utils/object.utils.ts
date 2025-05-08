export function oneOrZeroOf<T extends { [k: string]: boolean | undefined }>(options: T): keyof T | undefined {
    let opt: keyof T | undefined = undefined;
    for (const k in options) {
        if (options[k]) {
            if (opt === undefined) {
                opt = k;
            } else {
                throw new Error(`Please pick only one of the options: ${Object.keys(options).join(', ')}`);
            }
        }
    }
    return opt;
}

export function distinct<T>(values: T[]): T[] {
    return [...new Set(values)];
}