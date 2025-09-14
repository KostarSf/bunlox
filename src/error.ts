export class LoxError extends Error {
    constructor(message: string, nestedErrors: LoxError[] = []) {
        const nestedErrorMessages = nestedErrors.map((error) => error.message).join("");
        super(message + "\n" + nestedErrorMessages);
    }
}

export class SyntaxLoxError extends LoxError {
    constructor(line: number, where: string, message: string) {
        super(`[line ${line}] Error${where}: ${message}`);
    }
}

export function syntaxError(line: number, message: string) {
    return new SyntaxLoxError(line, "", message);
}
