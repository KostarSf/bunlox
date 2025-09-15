import { LoxError, parseError, ParseError } from "./core/error";
import type { Expr } from "./core/expressions";
import * as ex from "./core/expressions";
import type { Stmt } from "./core/statements";
import * as st from "./core/statements";
import type { Token } from "./core/token";
import type { TokenType } from "./core/token-types";
import type { TokenStream } from "./lib/token-stream";
import { fromArray, fromIterable } from "./lib/token-stream";

/*
 * Grammar:
 *
 * program        → statement* EOF
 *
 *
 * declaration    → varDecl
 *                  | statement
 *
 * varDecl        → "var" IDENTIFIER ( "=" expression )? ";"
 *
 *
 * statement      → exprStmt
 *                  | printStmt
 *
 * exprStmt       → expression ";"
 * printStmt      → "print" expression ";"
 *
 *
 * expression     → assignment
 *
 * assignment     → IDENTIFIER "=" assignment
 *                  | equality
 * equality       → comparison ( ( "!=" | "==" ) comparison )*
 * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )*
 * term           → factor ( ( "-" | "+" ) factor )*
 * factor         → unary ( ( "/" | "*" ) unary )*
 * unary          → ( "!" | "-" ) unary
 *                  | primary
 * primary        → "true" | "false" | "nil"
 *                  | NUMBER | STRING
 *                  | "(" expression ")"
 *                  | IDENTIFIER
 */

/**
 * @throws {ParseError}
 */
function parseTokensStream(stream: TokenStream) {
    const statements: Stmt[] = [];
    const errors: ParseError[] = [];

    const declaration = (): Stmt => {
        if (match("VAR")) return varDeclaration();
        return statement();
    };
    const varDeclaration = (): Stmt => {
        const name = consume("IDENTIFIER", "Expect variable name.");
        const initializer = match("EQUAL") ? expression() : null;
        consume("SEMICOLON", "Expect ';' after variable declaration.");
        return st.varDecl(name, initializer);
    };

    const statement = (): Stmt => {
        if (match("PRINT")) return printStatement();
        return expressionStatement();
    };
    const printStatement = (): Stmt => {
        const value = expression();
        consume("SEMICOLON", "Expect ';' after value.");
        return st.print(value);
    };
    const expressionStatement = (): Stmt => {
        const expr = expression();
        consume("SEMICOLON", "Expect ';' after expression.");
        return st.expr(expr);
    };

    const expression = (): Expr => assignment();
    const assignment = (): Expr => {
        const expr = equality();

        if (match("EQUAL")) {
            const equals = previous();
            const value = assignment();

            if (expr.type === "variable") {
                return ex.assignment(expr.name, value);
            }

            errors.push(parseError(equals, "Invalid assignment target."));
        }

        return expr;
    };
    const equality = (): Expr =>
        leftSeries(() => comparison(), ["BANG_EQUAL", "EQUAL_EQUAL"]);
    const comparison = (): Expr =>
        leftSeries(
            () => term(),
            ["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"]
        );
    const term = (): Expr => leftSeries(() => factor(), ["MINUS", "PLUS"]);
    const factor = (): Expr => leftSeries(() => unary(), ["SLASH", "STAR"]);
    const unary = (): Expr => {
        if (match("BANG", "MINUS")) {
            return ex.unary(previous(), unary());
        }
        return primary();
    };
    const primary = (): Expr => {
        if (match("FALSE")) return ex.literal(false);
        if (match("TRUE")) return ex.literal(true);
        if (match("NIL")) return ex.literal(null);

        if (match("NUMBER", "STRING")) return ex.literal(previous().literal);

        if (match("IDENTIFIER")) return ex.variable(previous());

        if (match("LEFT_PAREN")) {
            const expr = expression();
            consume("RIGHT_PAREN", "Expect ')' after expression.");
            return ex.grouping(expr);
        }

        throw parseError(peek(), "Expect expression.");
    };

    /**  Method for parsing a left-associative series of binary operators */
    const leftSeries = (exprFn: () => Expr, matchTypes: TokenType[]) => {
        let expr = exprFn();
        while (match(...matchTypes)) {
            expr = ex.binary(expr, previous(), exprFn());
        }
        return expr;
    };
    const match = (...types: TokenType[]) => {
        if (types.some(check)) {
            advance();
            return true;
        }

        return false;
    };
    const check = (type: TokenType) => !isAtEnd() && peek().type === type;
    const advance = () => stream.advance();
    const isAtEnd = () => stream.isAtEnd();
    const peek = () => stream.peek();
    const previous = () => stream.previous();
    /**
     * @throws {ParseError}
     */
    const consume = (type: TokenType, message: string) => {
        if (check(type)) return advance();
        throw parseError(peek(), message);
    };

    const synchronize = () => {
        if (!isAtEnd()) advance();

        while (!isAtEnd()) {
            if (previous().type === "SEMICOLON") return;

            switch (peek().type) {
                case "CLASS":
                case "FUN":
                case "VAR":
                case "FOR":
                case "IF":
                case "WHILE":
                case "PRINT":
                case "RETURN":
                    return;
            }

            advance();
        }
    };

    while (!isAtEnd()) {
        try {
            statements.push(declaration());
        } catch (error) {
            if (error instanceof ParseError) {
                errors.push(error);
                synchronize();
            } else {
                throw error;
            }
        }
    }

    if (errors.length > 0) {
        throw new LoxError("Syntax error", errors);
    }

    return statements;
}

/**
 * Unified parse: accepts Token[] or any Iterable<Token>
 * @throws {ParseError}
 */
export function parseAst(tokensOrIterable: Token[] | Iterable<Token>) {
    const isArray = Array.isArray(tokensOrIterable);
    const stream = isArray
        ? fromArray(tokensOrIterable as Token[])
        : fromIterable(tokensOrIterable as Iterable<Token>);
    return parseTokensStream(stream);
}
