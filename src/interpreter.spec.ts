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
import type { Stmt } from "./core/statements";
import * as st from "./core/statements";
import { token } from "./core/token";
import type { TokenType } from "./core/token-types";
import { interpret } from "./interpreter";
import { parseAst } from "./parser";
import { scanTokens } from "./scanner";

const t = (type: TokenType, lexeme: string) => token(type, lexeme);

function runAndCapture(ast: Expr) {
    const original = console.log;
    const out: string[] = [];
    console.log = (msg?: unknown) => {
        out.push(String(msg ?? ""));
    };
    try {
        interpret([st.expr(ast)], { repl: true });
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
        interpret(statements, { repl: true });
    } finally {
        console.log = original;
    }
    return out.map((s) => Bun.stripANSI(s));
}

function runSourceAndCapture(source: string) {
    const tokens = Array.from(scanTokens(source));
    const statements = parseAst(tokens);

    const original = console.log;
    const out: string[] = [];
    console.log = (msg?: unknown) => {
        out.push(String(msg ?? ""));
    };
    try {
        interpret(statements, { repl: true });
    } finally {
        console.log = original;
    }
    return out.map((s) => Bun.stripANSI(s));
}

describe("Interpreter", () => {
    describe("Core", () => {
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
            expect(() =>
                interpret([st.expr(variable(y))], { repl: true })
            ).toThrow(/Undefined variable 'never_defined_1'\./);
        });

        test("assigning to undefined variable throws", () => {
            const x = token("IDENTIFIER", "never_defined_2");
            expect(() =>
                interpret([st.expr(assignment(x, literal(1)))], { repl: true })
            ).toThrow(/Undefined variable 'never_defined_2'\./);
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
                runAndCapture(
                    binary(literal(1), t("BANG_EQUAL", "!="), literal(2))
                )
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
                runAndCapture(
                    binary(literal(2), t("LESS_EQUAL", "<="), literal(2))
                )
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
                runAndCapture(
                    binary(literal("foo"), t("PLUS", "+"), literal(1))
                )
            ).toBe('"foo1"');

            expect(
                runAndCapture(
                    binary(literal(1), t("PLUS", "+"), literal("bar"))
                )
            ).toBe('"1bar"');
        });
    });

    describe("Scope", () => {
        test("nested blocks shadow and see outer variables (strings)", () => {
            const source = `
                var a = "global a";
                var b = "global b";
                var c = "global c";
                {
                    var a = "outer a";
                    var b = "outer b";
                    {
                        var a = "inner a";
                        print a;
                        print b;
                        print c;
                    }
                    print a;
                    print b;
                    print c;
                }
                print a;
                print b;
                print c;
            `;

            const outputs = runSourceAndCapture(source);
            expect(outputs).toEqual([
                '"inner a"',
                '"outer b"',
                '"global c"',
                '"outer a"',
                '"outer b"',
                '"global c"',
                '"global a"',
                '"global b"',
                '"global c"',
            ]);
        });

        test("inner variable shadows outer, outer still accessible after block", () => {
            const source = `
                var a = "global";
                {
                    var a = "inner";
                    print a;
                }
                print a;
            `;

            const outputs = runSourceAndCapture(source);
            expect(outputs).toEqual(['"inner"', '"global"']);
        });

        test("variable defined in block is not visible outside", () => {
            const source = `
                {
                    var x = 123;
                }
                print x;
            `;

            expect(() => runSourceAndCapture(source)).toThrow(
                /Undefined variable 'x'\./
            );
        });
    });

    describe("Control flow", () => {
        test("if statements with else and dangling else associativity", () => {
            const source = `
                var a = 1;
                if (a > 0) {
                  print "a is positive";
                }

                if (a < 0) {
                  print "a is negative";
                } else {
                  print "a is not negative";
                }

                if (true) if (false) print "false"; else print "true";
            `;

            const outputs = runSourceAndCapture(source);
            expect(outputs).toEqual([
                '"a is positive"',
                '"a is not negative"',
                '"true"',
            ]);
        });
    });

    describe("Logical operators", () => {
        test("or returns first truthy operand", () => {
            const source = `
                print "hi" or 2;
                print nil or "yes";
            `;

            const outputs = runSourceAndCapture(source);
            expect(outputs).toEqual(['"hi"', '"yes"']);
        });

        test("and returns first falsy operand, otherwise last value", () => {
            const source = `
                print "hi" and 2;
                print nil and "yes";
            `;

            const outputs = runSourceAndCapture(source);
            expect(outputs).toEqual(["2", "nil"]);
        });
    });
});
