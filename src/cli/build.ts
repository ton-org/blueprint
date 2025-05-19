import arg from 'arg';

import { findContracts, selectOption } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import { buildAll, buildOne } from '../build';

import { helpArgs, helpMessages } from './constants';
import { Args, extractFirstArg, Runner } from './Runner';

export async function selectContract(ui: UIProvider, hint?: string ): Promise<string>;
export async function selectContract(ui: UIProvider, hint?: string, withAllOption?: boolean): Promise<string | string[]>;
export async function selectContract(ui: UIProvider, hint?: string, withAllOption: boolean = false):  Promise<string | string[]> {
    const contracts = await findContracts();
    const options = contracts.map<{ name: string; value: string }>((contract) => ({ name: contract, value: contract }));

    const allContractsValue = 'all_contracts';
    if (withAllOption) {
        const allContractsOption = {
            name: 'All Contracts',
            value: allContractsValue,
        }
        options.push(allContractsOption);
    }

    const selectedOption = await selectOption(options, {
        msg: 'Select contract to use',
        ui,
        hint,
    });

    if (selectedOption.value === allContractsValue) {
        return contracts;
    }

    return selectedOption.value;
}


export const build: Runner = async (args: Args, ui: UIProvider) => {
    const localArgs = arg({
        '--all': Boolean,
        ...helpArgs,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['build']);
        return;
    }

    if (localArgs['--all']) {
        await buildAll(ui);
    } else {
        const selected = await selectContract(ui, extractFirstArg(args), true);

        if (typeof selected === 'string') {
            await buildOne(selected, ui);
        } else {
            await buildAll(ui);
        }
    }
};
