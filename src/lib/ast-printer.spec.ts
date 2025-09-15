import { describe, expect, test } from "bun:test";

import { binary, grouping, literal, unary } from "../core/expressions";
import { token } from "../core/token";
import { printAst } from "./ast-printer";

describe("AST Printer", () => {
    test("should format expression correctly", () => {
        const expr = binary(
            unary(token("MINUS", "-"), literal(123)),
            token("STAR", "*"),
            grouping(literal(45.67))
        );

        const expected = "(* (- 123) (group 45.67))";
        const actual = printAst(expr);

        expect(actual).toBe(expected);
    });
});
