import inquirer from 'inquirer';
import { UIProvider } from '../ui/UIProvider';

class DestroyableBottomBar extends inquirer.ui.BottomBar {
    destroy() {
        this.close();
    }
}

export class InquirerUIProvider implements UIProvider {
    #bottomBar: DestroyableBottomBar;

    constructor() {
        this.#bottomBar = new DestroyableBottomBar();
    }

    write(message: string): void {
        this.#bottomBar.log.write(message);
    }

    async prompt(message: string): Promise<void> {
        await inquirer.prompt({
            type: 'confirm',
            name: message,
        });
    }

    async input(message: string): Promise<string> {
        const { val } = await inquirer.prompt({
            name: 'val',
            message: message,
        });
        return val;
    }

    async choose<T>(message: string, choices: T[], display: (v: T) => string): Promise<T> {
        const { choice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'choice',
                message: message,
                choices: choices.map((c) => ({ name: display(c), value: c })),
            },
        ]);
        return choice;
    }

    setActionPrompt(message: string): void {
        this.#bottomBar.updateBottomBar(message);
    }

    clearActionPrompt(): void {
        this.#bottomBar.updateBottomBar('');
    }

    close() {
        this.#bottomBar.destroy();
    }
}
