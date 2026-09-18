import path from 'path';
import fs from 'fs/promises';

import { Storage } from './Storage';

type StorageObject = {
    [k: string]: string;
};

export class FSStorage implements Storage {
    constructor(private readonly path: string) {}

    private async readObject(): Promise<StorageObject> {
        try {
            return JSON.parse((await fs.readFile(this.path)).toString('utf-8'));
        } catch (_) {
            return {};
        }
    }

    private async writeObject(obj: StorageObject): Promise<void> {
        const directory = path.dirname(this.path);
        await fs.mkdir(directory, { recursive: true, mode: 0o700 });
        await fs.chmod(directory, 0o700);
        await fs.writeFile(this.path, JSON.stringify(obj), { mode: 0o600 });
        await fs.chmod(this.path, 0o600);
    }

    async setItem(key: string, value: string): Promise<void> {
        const obj = await this.readObject();
        obj[key] = value;
        await this.writeObject(obj);
    }

    async getItem(key: string): Promise<string | null> {
        const obj = await this.readObject();
        return obj[key] ?? null;
    }

    async removeItem(key: string): Promise<void> {
        const obj = await this.readObject();
        delete obj[key];
        await this.writeObject(obj);
    }
}
