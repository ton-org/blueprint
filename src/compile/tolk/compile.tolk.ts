import { Cell } from '@ton/core';
import { getTolkCompilerVersion, runTolkCompiler, TolkCompilerConfig } from '@ton/tolk-js';

import { SourceSnapshot } from '../SourceSnapshot';

export type TolkCompileResult = {
    lang: 'tolk';
    stderr: string;
    fiftCode: string;
    code: Cell;
    snapshot: SourceSnapshot[];
    version: string;
};

export async function doCompileTolk(config: TolkCompilerConfig): Promise<TolkCompileResult> {
    const res = await runTolkCompiler(config);

    if (res.status === 'error') {
        throw new Error(res.message);
    }

    return {
        lang: 'tolk',
        stderr: res.stderr,
        fiftCode: res.fiftCode,
        code: Cell.fromBase64(res.codeBoc64),
        snapshot: res.sourcesSnapshot.map((e) => ({
            filename: e.filename,
            content: e.contents,
        })),
        version: await getTolkCompilerVersion(),
    };
}

export { getTolkCompilerVersion as getTolkVersion } from '@ton/tolk-js';
