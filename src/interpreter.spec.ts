import { describe, expect, test } from "bun:test";

import {
    assignment,
    binary,
    grouping,
    literal,
    unary,
    variable,
    type Expr,
} from "./core/expressions";
import * as st from "./core/statements";
import type { Stmt } from "./core/statements";
import { token } from "./core/token";
import type { TokenType } from "./core/token-types";
import { interpret } from "./interpreter";

const t = (type: TokenType, lexeme: string) => token(type, lexeme);

function runAndCapture(ast: Expr) {
    const original = console.log;
    const out: string[] = [];
    console.log = (msg?: unknown) => {
        out.push(String(msg ?? ""));
    };
    try {
        interpret([st.expr(ast)], true);
    } finally {
        console.log = original;
    }
    return Bun.stripANSI(out[0] ?? "");
}

function runStmtsAndCapture(statements: Stmt[]) {
    const original = console.log;
    const out: string[] = [];
    console.log = (msg?: unknown) => {
        out.push(String(msg ?? ""));
    };
    try {
        interpret(statements, true);
    } finally {
        console.log = original;
    }
    return out.map((s) => Bun.stripANSI(s));
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

    test("variable declaration with initializer and usage", () => {
        const x = token("IDENTIFIER", "x_init");
        const outputs = runStmtsAndCapture([
            st.varDecl(x, literal(10)),
            st.expr(variable(x)),
        ]);
        expect(outputs).toEqual(["10"]);
    });

    test("variable declaration without initializer defaults to nil", () => {
        const x = token("IDENTIFIER", "x_nil");
        const outputs = runStmtsAndCapture([
            st.varDecl(x, null),
            st.expr(variable(x)),
        ]);
        expect(outputs).toEqual(["nil"]);
    });

    test("assignment updates variable value", () => {
        const x = token("IDENTIFIER", "x_assign");
        const outputs = runStmtsAndCapture([
            st.varDecl(x, literal(1)),
            st.expr(assignment(x, literal(2))),
            st.expr(variable(x)),
        ]);
        expect(outputs).toEqual(["2", "2"]);
    });

    test("variable can be used in arithmetic expressions", () => {
        const x = token("IDENTIFIER", "x_arith");
        const outputs = runStmtsAndCapture([
            st.varDecl(x, literal(2)),
            st.expr(binary(variable(x), t("PLUS", "+"), literal(3))),
        ]);
        expect(outputs).toEqual(["5"]);
    });

    test("reading undefined variable throws", () => {
        const y = token("IDENTIFIER", "never_defined_1");
        expect(() => interpret([st.expr(variable(y))], true)).toThrow(
            /Undefined variable 'never_defined_1'\./
        );
    });

    test("assigning to undefined variable throws", () => {
        const x = token("IDENTIFIER", "never_defined_2");
        expect(() => interpret([st.expr(assignment(x, literal(1)))], true)).toThrow(
            /Undefined variable 'never_defined_2'\./
        );
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
