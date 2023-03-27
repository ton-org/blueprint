export interface UIProvider {
    write(message: string): void;
    prompt(message: string): Promise<boolean>;
    input(message: string): Promise<string>;
    choose<T>(message: string, choices: T[], display: (v: T) => string): Promise<T>;
    setActionPrompt(message: string): void;
    clearActionPrompt(): void;
}
