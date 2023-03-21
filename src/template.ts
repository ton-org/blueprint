import path from 'path';

export const TEMPLATES_DIR = path.join(__dirname, 'templates');

export function executeTemplate(contents: string, replaces: { [k: string]: string }) {
    for (const k in replaces) {
        contents = contents.replaceAll(`{{${k}}}`, replaces[k]);
    }

    return contents;
}
