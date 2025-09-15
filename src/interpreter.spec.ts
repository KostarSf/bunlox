import { describe, expect, test } from "bun:test";

import { binary, grouping, literal, unary } from "./expressions";
import { interpret } from "./interpreter";
import { token } from "./token";
import type { TokenType } from "./token-types";

const t = (type: TokenType, lexeme: string) => token(type, lexeme);

function runAndCapture(ast: any) {
    const original = console.log;
    const out: string[] = [];
    console.log = (msg?: unknown) => {
        out.push(String(msg ?? ""));
    };
    try {
        interpret(ast);
    } finally {
        console.log = original;
    }
    return Bun.stripANSI(out[0] ?? "");
}

describe("Interpreter", () => {
    test("mathematical operations", () => {
        expect(
            runAndCapture(binary(literal(1), t("PLUS", "+"), literal(2)))
        ).toBe("3");

        expect(
            runAndCapture(binary(literal(5), t("MINUS", "-"), literal(3)))
        ).toBe("2");

        expect(
            runAndCapture(binary(literal(6), t("SLASH", "/"), literal(2)))
        ).toBe("3");

        expect(
            runAndCapture(binary(literal(4), t("STAR", "*"), literal(2)))
        ).toBe("8");
    });

    test("parentheses affect precedence", () => {
        // 1 + 2 * 3 => 7
        const noParens = binary(
            literal(1),
            t("PLUS", "+"),
            binary(literal(2), t("STAR", "*"), literal(3))
        );
        expect(runAndCapture(noParens)).toBe("7");

        // (1 + 2) * 3 => 9
        const withParens = binary(
            grouping(binary(literal(1), t("PLUS", "+"), literal(2))),
            t("STAR", "*"),
            literal(3)
        );
        expect(runAndCapture(withParens)).toBe("9");
    });

    test("booleans", () => {
        expect(runAndCapture(literal(true))).toBe("true");
        expect(runAndCapture(literal(false))).toBe("false");
    });

    test("negations", () => {
        expect(runAndCapture(unary(t("MINUS", "-"), literal(123)))).toBe(
            "-123"
        );
        expect(runAndCapture(unary(t("BANG", "!"), literal(true)))).toBe(
            "false"
        );
        expect(runAndCapture(unary(t("BANG", "!"), literal(null)))).toBe(
            "true"
        );
    });

    test("equality and comparison operations", () => {
        expect(
            runAndCapture(
                binary(literal(1), t("EQUAL_EQUAL", "=="), literal(1))
            )
        ).toBe("true");

        expect(
            runAndCapture(binary(literal(1), t("BANG_EQUAL", "!="), literal(2)))
        ).toBe("true");

        expect(
            runAndCapture(binary(literal(3), t("GREATER", ">"), literal(2)))
        ).toBe("true");

        expect(
            runAndCapture(
                binary(literal(3), t("GREATER_EQUAL", ">="), literal(3))
            )
        ).toBe("true");

        expect(
            runAndCapture(binary(literal(2), t("LESS", "<"), literal(3)))
        ).toBe("true");

        expect(
            runAndCapture(binary(literal(2), t("LESS_EQUAL", "<="), literal(2)))
        ).toBe("true");

        // Different types are not equal
        expect(
            runAndCapture(
                binary(literal("1"), t("EQUAL_EQUAL", "=="), literal(1))
            )
        ).toBe("false");
    });

    test("string concatenations", () => {
        expect(
            runAndCapture(
                binary(literal("foo"), t("PLUS", "+"), literal("bar"))
            )
        ).toBe('"foobar"');

        expect(
            runAndCapture(binary(literal("foo"), t("PLUS", "+"), literal(1)))
        ).toBe('"foo1"');

        expect(
            runAndCapture(binary(literal(1), t("PLUS", "+"), literal("bar")))
        ).toBe('"1bar"');
    });
});
