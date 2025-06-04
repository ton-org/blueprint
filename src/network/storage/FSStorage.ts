import path from 'path';
import fs from 'fs/promises';

import { Storage } from './Storage';

type StorageObject = {
    [k: string]: string;
};

export class FSStorage implements Storage {
    #path: string;

    constructor(path: string) {
        this.#path = path;
    }

    async #readObject(): Promise<StorageObject> {
        try {
            return JSON.parse((await fs.readFile(this.#path)).toString('utf-8'));
        } catch (_) {
            return {};
        }
    }

    async #writeObject(obj: StorageObject): Promise<void> {
        await fs.mkdir(path.dirname(this.#path), { recursive: true });
        await fs.writeFile(this.#path, JSON.stringify(obj));
    }

    async setItem(key: string, value: string): Promise<void> {
        const obj = await this.#readObject();
        obj[key] = value;
        await this.#writeObject(obj);
    }

    async getItem(key: string): Promise<string | null> {
        const obj = await this.#readObject();
        return obj[key] ?? null;
    }

    async removeItem(key: string): Promise<void> {
        const obj = await this.#readObject();
        delete obj[key];
        await this.#writeObject(obj);
    }
}
