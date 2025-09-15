import { describe, expect, test } from "bun:test";
import { LoxError } from "./error";
import { printAst } from "./lib/ast-printer";
import { parseAst } from "./parser";
import { scanTokens } from "./scanner";

describe("Parser", () => {
    test("parses arithmetic grouping and unary", () => {
        const input = "(-123) * (45.67)";
        const tokens = Array.from(scanTokens(input));
        const ast = parseAst(tokens);
        expect(printAst(ast)).toBe("(* (group (- 123)) (group 45.67))");
    });

    test("parses equality with unary and literals", () => {
        const input = "!true == false";
        const tokens = Array.from(scanTokens(input));
        const ast = parseAst(tokens);
        expect(printAst(ast)).toBe("(== (! true) false)");
    });

    test("throws on invalid expression", () => {
        const input = "(";
        const tokens = Array.from(scanTokens(input));
        expect(() => parseAst(tokens)).toThrow(LoxError);
    });

    test("handles long equality chain with final !=", () => {
        const input = "1 == 7 == 6 == 4 != 2";
        const ast = parseAst(scanTokens(input));
        expect(printAst(ast)).toBe("(!= (== (== (== 1 7) 6) 4) 2)");
    });

    test("respects precedence with grouping and !=", () => {
        const input = "1 + 1 * (2 - 1) != 3";
        const ast = parseAst(scanTokens(input));
        expect(printAst(ast)).toBe("(!= (+ 1 (* 1 (group (- 2 1)))) 3)");
    });

    test("grouped equality chain compared with >=", () => {
        const input = "(1 == 2 == 3) >= 4";
        const ast = parseAst(scanTokens(input));
        expect(printAst(ast)).toBe("(>= (group (== (== 1 2) 3)) 4)");
    });

    test("trailing semicolon allowed after expression", () => {
        const input = "1 == (2 + 3) * 4 / (2 - 1);";
        const ast = parseAst(scanTokens(input));
        expect(printAst(ast)).toBe("(== 1 (/ (* (group (+ 2 3)) 4) (group (- 2 1))))");
    });

    test("missing closing paren reports error at semicolon", () => {
        const input = "(1 == 2 == 3 >= 4;";
        const tokens = Array.from(scanTokens(input));
        try {
            parseAst(tokens);
            throw new Error("Expected parseAst to throw");
        } catch (err) {
            expect(err instanceof LoxError).toBe(true);
            expect(String(err)).toContain("[line 1] Error at ';': Expect ')' after expression.");
        }
    });
});
