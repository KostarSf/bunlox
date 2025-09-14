export class LoxError extends Error {
    constructor(line: number, where: string, message: string) {
        super(`[line ${line}] Error${where}: ${message}`);
    }
}

export function error(line: number, message: string) {
    throw new LoxError(line, "", message);
}
