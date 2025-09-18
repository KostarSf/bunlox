import { isCallable, type Literal } from "../core/literal";
import { color } from "./colors";

export function stringify(value: Literal): string {
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

    if (isCallable(value)) {
        return value.toString();
    }

    return JSON.stringify(value);
}
