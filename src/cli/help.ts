import { UIProvider } from '../ui/UIProvider';
import { Args, Runner } from './Runner';
import { helpMessages } from './constants';

export let additionalHelpMessages: Record<string, string> = {};

export function buildHelpMessage(cmd: string = '') {
    const effectiveHelpMessages: Record<string, string> = {
        ...additionalHelpMessages,
        ...helpMessages,
    };

    for (const k in additionalHelpMessages) {
        effectiveHelpMessages.help += '\n- ' + k;
    }

    return cmd in effectiveHelpMessages ? effectiveHelpMessages[cmd] : effectiveHelpMessages['help'];
}

export const help: Runner = async (args: Args, ui: UIProvider) => {
    const cmd = args._.length >= 2 ? args._[1].toLowerCase() : '';
    const helpMessage = buildHelpMessage(cmd);

    ui.write(helpMessage);
};
