import { describe, expect, test } from "bun:test";

import { printAst } from "./ast-printer";
import { binary, grouping, literal, unary } from "../expressions";
import { token } from "../token";

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
