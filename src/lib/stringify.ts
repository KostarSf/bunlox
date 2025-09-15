export function stringify(value: unknown): string {
    const resetColor = Bun.color("white", "ansi");

    if (value === null || value === undefined) {
        const color = Bun.color("lightgray", "ansi");
        return `${color}nil${resetColor}`;
    }

    if (typeof value === "boolean") {
        const color = Bun.color("yellow", "ansi");
        const boolStr = value ? "true" : "false";
        return `${color}${boolStr}${resetColor}`;
    }

    if (typeof value === "number") {
        const color = Bun.color("yellow", "ansi");
        return `${color}${value.toString()}${resetColor}`;
    }

    if (typeof value === "string") {
        const color = Bun.color("green", "ansi");
        return `${color}"${value}"${resetColor}`;
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return value.toString();
}
