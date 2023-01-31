import path from "path";
import fs from "fs/promises";
import { Storage } from "./Storage";

export class FSStorage implements Storage {
    #path: string;

    constructor(path: string) {
        this.#path = path;
    }

    async setItem(key: string, value: string): Promise<void> {
        await fs.mkdir(this.#path, { recursive: true });
        return fs.writeFile(path.join(this.#path, key), value);
    }

    async getItem(key: string): Promise<string | null> {
        try {
            return (await fs.readFile(path.join(this.#path, key))).toString();
        } catch (e) {
            return null;
        }
    }

    async removeItem(key: string): Promise<void> {
        return fs.unlink(path.join(this.#path, key));
    }
}