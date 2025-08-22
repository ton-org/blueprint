import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'fs';

import type { Reporter, ReporterContext } from '@jest/reporters';
import { Cell } from '@ton/core';
// @ts-expect-error blueprint imported inside package
import { buildAll } from '@ton/blueprint';
import { collectAsmCoverage, Coverage, mergeCoverages } from '@ton/sandbox';

type ContractMeta = {
    name: string;
    hash: string;
    hashBase64: string;
    hex: string;
};

class CoverageReporter implements Reporter {
    private contracts: ContractMeta[] = [];

    private get coverageDir() {
        return path.join(process.cwd(), 'coverage');
    }

    private get blueprintCoverageDir() {
        return path.join(this.coverageDir, 'blueprint');
    }

    async onRunStart() {
        console.log(`\n🛠️  Building contracts...`);
        await buildAll();

        const buildDir = path.join(process.cwd(), 'build');
        const buildFiles = (await fs.readdir(buildDir)).filter((f) => f.endsWith('.json'));

        const contents = await Promise.all(buildFiles.map((f) => fs.readFile(path.join(buildDir, f), 'utf-8')));

        this.contracts = contents.map((json, i) => ({
            name: path.basename(buildFiles[i], '.compiled.json'),
            ...JSON.parse(json),
        }));

        console.log(`✅ Built ${this.contracts.length} contracts: ${this.contracts.map((c) => c.name).join(', ')}`);

        if (existsSync(this.blueprintCoverageDir)) {
            console.log(`🧹 Cleaning old coverage at ${this.blueprintCoverageDir}`);
            await fs.rm(this.blueprintCoverageDir, { recursive: true, force: true });
        }
    }

    async onRunComplete() {
        if (!existsSync(this.blueprintCoverageDir)) {
            console.log(`⚠️  No blueprint coverage data found, skipping coverage reports.`);
            return;
        }

        console.log(`\n📄 Collecting coverage logs...`);
        const logs = await this.collectLogs();

        console.log(`\n📝 Generating coverage reports...`);
        await Promise.all(
            this.contracts.map(async ({ name, hex }) => {
                const codeCell = Cell.fromHex(hex);
                const merged = mergeCoverages(...logs.map((l) => collectAsmCoverage(codeCell, l)));
                const report = new Coverage(merged).report('html');
                if (report) {
                    const reportPath = path.join(this.coverageDir, `${name}-report.html`);
                    await fs.writeFile(reportPath, report);
                    console.log(`   • ${name} → ${reportPath}`);
                }
            }),
        );
        console.log(`\n✅ Coverage reports generated in ${this.coverageDir}\n`);
    }

    private async collectLogs(): Promise<string[]> {
        const files = (await fs.readdir(this.blueprintCoverageDir, { recursive: true })).filter((f) => f.endsWith('.json'));

        const contents = await Promise.all(files.map((f) => fs.readFile(path.join(this.blueprintCoverageDir, f), 'utf-8')));

        return contents.flatMap((content) => {
            const { txLogs, getLogs } = JSON.parse(content);
            return [...txLogs, ...getLogs];
        });
    }
}

export default CoverageReporter;
