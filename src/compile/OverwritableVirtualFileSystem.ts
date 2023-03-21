import { VirtualFileSystem } from '@tact-lang/compiler';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

export class OverwritableVirtualFileSystem implements VirtualFileSystem {
    root: string = '/';
    overwrites: Map<string, Buffer> = new Map();

    resolve(...path: string[]): string {
        return resolve(...path);
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
