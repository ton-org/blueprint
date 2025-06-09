import { Dirent } from 'fs';
import path from 'path';

import { File } from '../types/file';

export function extractFile(dirent: Dirent<string>): File {
    if (dirent.parentPath !== undefined) {
        return {
            path: dirent.parentPath,
            name: dirent.name,
        };
    }

    if (dirent.path !== undefined) {
        return {
            path: dirent.path,
            name: dirent.name,
        };
    }

    return {
        path: path.dirname(dirent.name),
        name: path.basename(dirent.name),
    };
}
