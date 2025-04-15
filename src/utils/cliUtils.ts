/**
 * Uniformly retrieves the entity name (contract, script, etc.) from positional arguments.
 * @param args - Command line arguments array (including command and entity name).
 * @param prompt - Optional function for interactive input if the name is not provided.
 * @returns {Promise<string | undefined>} The entity name or undefined if not found and no prompt provided.
 */
export async function getEntityName(args: string[], prompt?: () => Promise<string>): Promise<string | undefined> {
    // Check for the positional argument (the second element in the array)
    if (args.length > 1 && typeof args[1] === 'string' && args[1].trim().length > 0) {
        return args[1].trim();
    }
    
    // If the argument is not provided, try using the interactive prompt
    if (prompt) {
        return await prompt();
    }
    
    // If no name found and no prompt provided, return undefined
    return undefined;
    // throw new Error('Entity name is required but not provided.'); // Do not throw error here
} 