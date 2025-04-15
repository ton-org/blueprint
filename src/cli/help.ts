import { UIProvider } from '../ui/UIProvider';
import { Args, Runner } from './Runner';
import { helpMessages } from './constants';
import { getEntityName } from '../utils/cliUtils';

export let additionalHelpMessages: Record<string, string> = {};

export const help: Runner = async (args: Args, ui: UIProvider) => {
    const cmd = await getEntityName(
        args._,
        async () => ''
    );
    if (!cmd) {
        ui.write(helpMessages.help);
        return;
    }
    const key = cmd as keyof typeof helpMessages;
    if (key && helpMessages[key]) {
        ui.write(helpMessages[key]);
    } else {
        ui.write(helpMessages.help);
    }
};
