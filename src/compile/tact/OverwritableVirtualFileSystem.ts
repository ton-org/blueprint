import { VirtualFileSystem } from '@tact-lang/compiler';
import { resolve, normalize, sep } from 'path';
import { existsSync, readFileSync } from 'fs';

export class OverwritableVirtualFileSystem implements VirtualFileSystem {
    root: string;
    overwrites: Map<string, Buffer> = new Map();

    constructor(root: string) {
        this.root = normalize(root);
        if (!this.root.endsWith(sep)) {
            this.root += sep;
        }
    }

    resolve(...path: string[]): string {
        return normalize(resolve(this.root, ...path));
    }

    exists(path: string): boolean {
        return existsSync(path);
    }

    readFile(path: string): Buffer {
        return this.overwrites.get(path) ?? readFileSync(path);
    }

    writeFile(path: string, content: string | Buffer): void {
        this.overwrites.set(path, typeof content === 'string' ? Buffer.from(content, 'utf-8') : content);
    }
}
