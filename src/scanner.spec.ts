import { describe, test, expect } from "bun:test";
import { scanTokens } from "./scanner";

describe("Scanner", () => {
    test("should scan basic tokens and operators correctly", () => {
        const input = `// this is a comment
(( )){} // grouping stuff
!*+-/=<> <= == % // operators
`;

        const tokens = Array.from(scanTokens(input));

        expect(tokens).toHaveLength(18);

        // Test each token in order
        expect(tokens[0]?.toString()).toBe("Token { type: LEFT_PAREN, lexeme: (, literal: null, line: 2 }");
        expect(tokens[1]?.toString()).toBe("Token { type: LEFT_PAREN, lexeme: (, literal: null, line: 2 }");
        expect(tokens[2]?.toString()).toBe("Token { type: RIGHT_PAREN, lexeme: ), literal: null, line: 2 }");
        expect(tokens[3]?.toString()).toBe("Token { type: RIGHT_PAREN, lexeme: ), literal: null, line: 2 }");
        expect(tokens[4]?.toString()).toBe("Token { type: LEFT_BRACE, lexeme: {, literal: null, line: 2 }");
        expect(tokens[5]?.toString()).toBe("Token { type: RIGHT_BRACE, lexeme: }, literal: null, line: 2 }");
        expect(tokens[6]?.toString()).toBe("Token { type: BANG, lexeme: !, literal: null, line: 3 }");
        expect(tokens[7]?.toString()).toBe("Token { type: STAR, lexeme: *, literal: null, line: 3 }");
        expect(tokens[8]?.toString()).toBe("Token { type: PLUS, lexeme: +, literal: null, line: 3 }");
        expect(tokens[9]?.toString()).toBe("Token { type: MINUS, lexeme: -, literal: null, line: 3 }");
        expect(tokens[10]?.toString()).toBe("Token { type: SLASH, lexeme: /, literal: null, line: 3 }");
        expect(tokens[11]?.toString()).toBe("Token { type: EQUAL, lexeme: =, literal: null, line: 3 }");
        expect(tokens[12]?.toString()).toBe("Token { type: LESS, lexeme: <, literal: null, line: 3 }");
        expect(tokens[13]?.toString()).toBe("Token { type: GREATER, lexeme: >, literal: null, line: 3 }");
        expect(tokens[14]?.toString()).toBe("Token { type: LESS_EQUAL, lexeme: <=, literal: null, line: 3 }");
        expect(tokens[15]?.toString()).toBe("Token { type: EQUAL_EQUAL, lexeme: ==, literal: null, line: 3 }");
        expect(tokens[16]?.toString()).toBe("Token { type: PERCENT, lexeme: %, literal: null, line: 3 }");
        expect(tokens[17]?.toString()).toBe("Token { type: EOF, lexeme: , literal: null, line: 4 }");
    });

    test("should handle comments correctly", () => {
        const input = `// this is a comment
print "hello"; // another comment`;

        const tokens = Array.from(scanTokens(input));

        // Should only have PRINT, STRING, SEMICOLON, and EOF tokens
        expect(tokens).toHaveLength(4);
        expect(tokens[0]?.type).toBe("PRINT");
        expect(tokens[1]?.type).toBe("STRING");
        expect(tokens[1]?.literal).toBe("hello");
        expect(tokens[2]?.type).toBe("SEMICOLON");
        expect(tokens[3]?.type).toBe("EOF");
    });

    test("should handle strings correctly", () => {
        const input = `"hello world" "test"`;

        const tokens = Array.from(scanTokens(input));

        expect(tokens).toHaveLength(3);
        expect(tokens[0]?.type).toBe("STRING");
        expect(tokens[0]?.literal).toBe("hello world");
        expect(tokens[1]?.type).toBe("STRING");
        expect(tokens[1]?.literal).toBe("test");
        expect(tokens[2]?.type).toBe("EOF");
    });

    test("should handle numbers correctly", () => {
        const input = `123 45.67 0.5`;

        const tokens = Array.from(scanTokens(input));

        expect(tokens).toHaveLength(4);
        expect(tokens[0]?.type).toBe("NUMBER");
        expect(tokens[0]?.literal).toBe(123);
        expect(tokens[1]?.type).toBe("NUMBER");
        expect(tokens[1]?.literal).toBe(45.67);
        expect(tokens[2]?.type).toBe("NUMBER");
        expect(tokens[2]?.literal).toBe(0.5);
        expect(tokens[3]?.type).toBe("EOF");
    });

    test("should handle identifiers and keywords correctly", () => {
        const input = `var hello = true;`;

        const tokens = Array.from(scanTokens(input));

        expect(tokens).toHaveLength(6);
        expect(tokens[0]?.type).toBe("VAR");
        expect(tokens[1]?.type).toBe("IDENTIFIER");
        expect(tokens[1]?.lexeme).toBe("hello");
        expect(tokens[2]?.type).toBe("EQUAL");
        expect(tokens[3]?.type).toBe("TRUE");
        expect(tokens[4]?.type).toBe("SEMICOLON");
        expect(tokens[5]?.type).toBe("EOF");
    });

    test("should handle whitespace correctly", () => {
        const input = `   \t\n\r   `;

        const tokens = Array.from(scanTokens(input));

        // Should only have EOF token
        expect(tokens).toHaveLength(1);
        expect(tokens[0]?.type).toBe("EOF");
    });

    test("should handle empty input", () => {
        const input = ``;

        const tokens = Array.from(scanTokens(input));

        expect(tokens).toHaveLength(1);
        expect(tokens[0]?.type).toBe("EOF");
    });
});
