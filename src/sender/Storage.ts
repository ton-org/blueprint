import path from "path";
import fs from "fs/promises";

export interface Storage {
    /**
     * Saves the `value` to the storage. Value can be accessed later by the `key`. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access to the value later.
     * @param value value to save.
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Reads the `value` from the storage. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access the value.
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Removes the `value` from the storage. Implementation may use backend as a storage due to the fact that the function returns a promise.
     * @param key key to access the value.
     */
    removeItem(key: string): Promise<void>;
}

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
