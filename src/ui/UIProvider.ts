import { Address } from '@ton/core';

/**
 * Interface for handling user interactions, such as displaying messages,
 * prompting for input, and managing action prompts.
 */
export interface UIProvider {
    /**
     * Writes a message to the user interface (e.g., console or UI panel).
     * @param {string} message - The message to display.
     * @example
     * const ui: UIProvider = ...
     * ui.write("Transaction sent successfully.");
     */
    write(message: string): void;

    /**
     * Prompts the user with a yes/no confirmation.
     * @param {string} message - The message to display in the prompt.
     * @returns {Promise<boolean>} A promise that resolves to true if the user confirms, otherwise false.
     * @example
     * const ui: UIProvider = ...
     * const confirmed = await ui.prompt("Do you want to proceed?");
     */
    prompt(message: string): Promise<boolean>;

    /**
     * Prompts the user to input a TON address.
     * @param {string} message - The prompt message.
     * @param {Address} [fallback] - A default address to use if the user provides no input.
     * @returns {Promise<Address>} A promise that resolves to the input address.
     * @example
     * const ui: UIProvider = ...
     * const address = await ui.inputAddress("Enter destination address:", myWalletAddress);
     */
    inputAddress(message: string, fallback?: Address): Promise<Address>;

    /**
     * Prompts the user to input a string value.
     * @param {string} message - The message to display in the prompt.
     * @returns {Promise<string>} A promise that resolves to the user's input.
     * @example
     * const ui: UIProvider = ...
     * const nickname = await ui.input("Enter your nickname:");
     */
    input(message: string): Promise<string>;

    /**
     * Prompts the user to choose from a list of options.
     * @param {string} message - The prompt message.
     * @param {T[]} choices - An array of choices to select from.
     * @param {(v: T) => string} display - A function that returns a string to display for each choice.
     * @returns {Promise<T>} A promise that resolves to the selected item.
     * @example
     * const ui: UIProvider = ...
     * const network = await ui.choose("Select a network:", ["mainnet", "testnet"], n => n.toUpperCase());
     */
    choose<T>(message: string, choices: T[], display: (v: T) => string): Promise<T>;

    /**
     * Sets a persistent action prompt (e.g., status indicator) in the UI. New call of `setActionPrompt` will replace
     * the previous action prompt.
     * @param {string} message - The action message to display.
     * @example
     * ui.setActionPrompt("Awaiting transaction confirmation...");
     */
    setActionPrompt(message: string): void;

    /**
     * Clears the current action prompt from the UI.
     * @example
     * ui.clearActionPrompt();
     */
    clearActionPrompt(): void;
}
