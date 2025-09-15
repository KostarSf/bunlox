import { color } from "./colors";

export function stringify(value: unknown): string {
    if (value === null || value === undefined) {
        return color("lightgray", "nil");
    }

    if (typeof value === "boolean") {
        const boolStr = value ? "true" : "false";
        return color("yellow", boolStr);
    }

    if (typeof value === "number") {
        return color("yellow", value.toString());
    }

    if (typeof value === "string") {
        return color("lightgreen", `"${value}"`);
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return value.toString();
}
