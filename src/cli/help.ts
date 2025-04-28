import { UIProvider } from '../ui/UIProvider';
import { Args, Runner } from './Runner';
import { helpMessages } from './constants';
import { getEntityName } from '../utils/cliUtils';

export let additionalHelpMessages: Record<string, string> = {};

export const help: Runner = async (args: Args, ui: UIProvider) => {
    const cmd = args._.length >= 2 ? args._[1].toLowerCase() : '';

    const effectiveHelpMessages: Record<string, string> = {
        ...additionalHelpMessages,
        ...helpMessages,
    };

    for (const k in additionalHelpMessages) {
        effectiveHelpMessages.help += '\n- ' + k;
    }

    const helpMessage = cmd in effectiveHelpMessages ? effectiveHelpMessages[cmd] : effectiveHelpMessages['help'];

    ui.write(helpMessage);
};
