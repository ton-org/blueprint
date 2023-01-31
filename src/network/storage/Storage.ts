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
