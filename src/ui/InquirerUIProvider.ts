import inquirer from 'inquirer';
import { UIProvider } from '../ui/UIProvider';

const bottomBar = new inquirer.ui.BottomBar();

export class InquirerUIProvider implements UIProvider {
    write(str: string): void {
        bottomBar.log.write(str);
    }

    async prompt(str: string): Promise<void> {
        await inquirer.prompt([
            {
                type: 'confirm',
                name: 'Press enter when transaction was issued',
            },
        ]);
    }

    async choose<T>(msg: string, choices: T[], display: (v: T) => string): Promise<T> {
        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: msg,
                choices: choices.map((c) => ({ name: display(c), value: c })),
            },
        ]);
        return choice;
    }

    setActionPrompt(str: string): void {
        bottomBar.updateBottomBar(str);
    }

    clearActionPrompt(): void {
        bottomBar.updateBottomBar('');
    }
}
