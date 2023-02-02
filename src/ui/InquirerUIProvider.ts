import inquirer from 'inquirer';
import { UIProvider } from '../ui/UIProvider';

export class InquirerUIProvider implements UIProvider {
    #bottomBar: inquirer.ui.BottomBar;

    constructor() {
        this.#bottomBar = new inquirer.ui.BottomBar();
    }

    write(str: string): void {
        this.#bottomBar.log.write(str);
    }

    async prompt(str: string): Promise<void> {
        await inquirer.prompt([
            {
                type: 'confirm',
                name: str,
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
        this.#bottomBar.updateBottomBar(str);
    }

    clearActionPrompt(): void {
        this.#bottomBar.updateBottomBar('');
    }
}
