export interface UIProvider {
    write(str: string): void;
    prompt(str: string): Promise<void>;
    choose<T>(msg: string, choices: T[], display: (v: T) => string): Promise<T>;
    setActionPrompt(str: string): void;
}