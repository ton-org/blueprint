import fs from 'node:fs';
import path from 'node:path';

import { Blockchain, BlockchainTransaction, GetMethodResult } from '@ton/sandbox';

const txLogs: string[] = [];
const getLogs: string[] = [];

beforeAll(() => {
    const originalCreate = Blockchain.create.bind(Blockchain);

    Blockchain.create = async (...args): Promise<any> => {
        const blockchain = await originalCreate(...args);

        blockchain.enableCoverage();

        const originalVerbosity = { ...blockchain.verbosity };
        originalVerbosity.print = false;
        originalVerbosity.vmLogs = 'vm_logs_verbose';

        Object.defineProperty(blockchain, 'verbosity', {
            get() {
                return originalVerbosity;
            },
            set(_) {
                // prevent changes
            },
        });

        blockchain.verbosity = originalVerbosity;

        // @ts-expect-error error
        const origRegisterTx = blockchain.registerTxsForCoverage.bind(blockchain);
        // @ts-expect-error error
        const origRegisterGet = blockchain.registerGetMethodForCoverage.bind(blockchain);

        // @ts-expect-error error
        blockchain.registerTxsForCoverage = (txs: BlockchainTransaction[]) => {
            txLogs.push(...txs.map((tx) => tx.vmLogs));
            return origRegisterTx(txs);
        };

        // @ts-expect-error error
        blockchain.registerGetMethodForCoverage = (gets: GetMethodResult) => {
            getLogs.push(gets.vmLogs);
            return origRegisterGet(gets);
        };

        return blockchain;
    };
});

afterAll(() => {
    const coveragePath = path.join(process.cwd(), 'coverage');
    const blueprintCoveragePath = path.join(coveragePath, 'blueprint');

    const testPath = expect.getState().testPath as string;
    const testRelative = path.relative(process.cwd(), testPath);

    const logsFilePath = path.join(blueprintCoveragePath, testRelative + '.json');
    fs.mkdirSync(path.dirname(logsFilePath), { recursive: true });
    fs.writeFileSync(logsFilePath, JSON.stringify({ txLogs, getLogs }, null, 2));
});
