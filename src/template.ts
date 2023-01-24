import { readFile } from "fs/promises";
import * as path from "path";

const TEMPLATES = 'templates'

export async function executeTemplate(template: string, replaces: { [k: string]: string }) {
    let contents = (await readFile(path.join(__dirname, TEMPLATES, template))).toString()

    for (const k in replaces) {
        contents = contents.replaceAll(`{{${k}}}`, replaces[k])
    }

    return contents
}