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
 *                  | funDecl
 *                  | statement
 * varDecl        → "var" IDENTIFIER ( "=" expression )? ";"
 * funDecl        → "fun" function
 * function       → IDENTIFIER "(" parameters? ")" block
 * parameters     → IDENTIFIER ( "," IDENTIFIER )*
 *
 *
 * statement      → exprStmt
 *                  | ifStmt
 *                  | printStmt
 *                  | whileStmt
 *                  | forStmt
 *                  | returnStmt
 *                  | breakStmt
 *                  | block
 * ifStmt         → "if" "(" expression ")" statement ( "else" statement )?
 * printStmt      → "print" expression ";"
 * whileStmt      → "while" "(" expression ")" statement
 * forStmt        → "for" "(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")" statement
 * returnStmt     → "return" expression? ";"
 * breakStmt      → "break" ";"
 * block          → "{" declaration* "}"
 * exprStmt       → expression ";"
 *
 *
 * expression     → assignment
 * assignment     → IDENTIFIER "=" assignment
 *                  | logic_or
 * logic_or       → logic_and ( "or" logic_and )*
 * logic_and      → equality ( "and" equality )*
 * equality       → comparison ( ( "!=" | "==" ) comparison )*
 * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )*
 * term           → factor ( ( "-" | "+" ) factor )*
 * factor         → unary ( ( "/" | "*" ) unary )*
 * unary          → ( "!" | "-" ) unary
 *                  | call
 * call           → primary ( "(" arguments? ")" )*
 * arguments      → expression ( "," expression )*
 * primary        → "true" | "false" | "nil"
 *                  | NUMBER | STRING
 *                  | "(" expression ")"
 *                  | IDENTIFIER
 *
 *
 * Note: Try to implement pattern matching and pipes later.
 */

/**
 * @throws {ParseError}
 */
function parseTokensStream(stream: TokenStream) {
    const statements: Stmt[] = [];
    const errors: ParseError[] = [];

    const declaration = (): Stmt => {
        if (match("FUN")) return functionDeclaration("function");
        if (match("VAR")) return varDeclaration();
        return statement();
    };
    const varDeclaration = (): Stmt => {
        const name = consume("IDENTIFIER", "Expect variable name.");
        const initializer = match("EQUAL") ? expression() : null;
        consume("SEMICOLON", "Expect ';' after variable declaration.");
        return st.varDecl(name, initializer);
    };
    const functionDeclaration = (kind: string): Stmt => {
        const name = consume("IDENTIFIER", `Expect ${kind} name.`);
        consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);
        const parameters: Token[] = [];
        if (!check("RIGHT_PAREN")) {
            do {
                if (parameters.length >= 255) {
                    errors.push(
                        parseError(
                            peek(),
                            "Can't have more than 255 parameters."
                        )
                    );
                }
                parameters.push(
                    consume("IDENTIFIER", "Expect parameter name.")
                );
            } while (match("COMMA"));
        }
        consume("RIGHT_PAREN", `Expect ')' after parameters.`);
        consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);
        const body = blockStatement();
        return st.functionStmt(name, parameters, body);
    };
    const statement = (): Stmt => {
        if (match("IF")) return ifStatement();
        if (match("PRINT")) return printStatement();
        if (match("RETURN")) return returnStatement();
        if (match("WHILE")) return whileStatement();
        if (match("FOR")) return forStatement();
        if (match("BREAK")) return breakStatement();
        if (match("LEFT_BRACE")) return st.block(blockStatement());
        return expressionStatement();
    };
    const ifStatement = (): Stmt => {
        consume("LEFT_PAREN", "Expect '(' after 'if'.");
        const condition = expression();
        consume("RIGHT_PAREN", "Expect ')' after condition.");
        const thenBranch = statement();
        const elseBranch = match("ELSE") ? statement() : null;
        return st.ifStmt(condition, thenBranch, elseBranch);
    };
    const whileStatement = (): Stmt => {
        consume("LEFT_PAREN", "Expect '(' after 'while'.");
        const condition = expression();
        consume("RIGHT_PAREN", "Expect ')' after condition.");
        const body = statement();
        return st.whileStmt(condition, body);
    };
    const forStatement = (): Stmt => {
        consume("LEFT_PAREN", "Expect '(' after 'for'.");
        const initializer = match("SEMICOLON")
            ? null
            : match("VAR")
            ? varDeclaration()
            : expressionStatement();

        const condition = check("SEMICOLON") ? null : expression();
        consume("SEMICOLON", "Expect ';' after loop condition.");

        const increment = check("RIGHT_PAREN") ? null : expression();
        consume("RIGHT_PAREN", "Expect ')' after for clauses.");

        let body = statement();

        if (increment !== null) {
            body = st.block([body, st.expr(increment)]);
        }

        body = st.whileStmt(condition ?? ex.literal(true), body);

        if (initializer !== null) {
            body = st.block([initializer, body]);
        }

        return body;
    };
    const returnStatement = (): Stmt => {
        const keyword = previous();
        let value = null;
        if (!match("SEMICOLON")) {
            value = expression();
            consume("SEMICOLON", "Expect ';' after return.");
        }
        return st.returnStmt(keyword, value);
    };
    const breakStatement = (): Stmt => {
        consume("SEMICOLON", "Expect ';' after break.");
        return st.breakStmt(previous());
    };
    const blockStatement = (): Stmt[] => {
        const statements: Stmt[] = [];
        while (!check("RIGHT_BRACE") && !isAtEnd()) {
            statements.push(declaration());
        }
        consume("RIGHT_BRACE", "Expect '}' after block.");
        return statements;
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

    const expression = (): Expr => functionExpr();
    const functionExpr = (): Expr => {
        if (!match("FUN")) return assignment();
        consume("LEFT_PAREN", "Expect '(' after 'fun'.");
        const parameters: Token[] = [];
        if (!check("RIGHT_PAREN")) {
            do {
                parameters.push(
                    consume("IDENTIFIER", "Expect parameter name.")
                );
            } while (match("COMMA"));
        }
        consume("RIGHT_PAREN", "Expect ')' after parameters.");
        consume("LEFT_BRACE", "Expect '{' before function body.");
        const body = blockStatement();
        return ex.functionExpr(parameters, body);
    };
    const assignment = (): Expr => {
        const expr = or();

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
    const or = (): Expr => leftSeries(() => and(), ["OR"], "logical");
    const and = (): Expr => leftSeries(() => equality(), ["AND"], "logical");
    const equality = (): Expr =>
        leftSeries(() => comparison(), ["BANG_EQUAL", "EQUAL_EQUAL"], "binary");
    const comparison = (): Expr =>
        leftSeries(
            () => term(),
            ["GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"],
            "binary"
        );
    const term = (): Expr =>
        leftSeries(() => factor(), ["MINUS", "PLUS"], "binary");
    const factor = (): Expr =>
        leftSeries(() => unary(), ["SLASH", "STAR", "PERCENT"], "binary");
    const unary = (): Expr => {
        if (match("BANG", "MINUS")) {
            return ex.unary(previous(), unary());
        }
        return call();
    };
    const call = (): Expr => {
        let expr = primary();
        while (true) {
            if (match("LEFT_PAREN")) {
                expr = finishCall(expr);
            } else {
                break;
            }
        }
        return expr;
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

    const finishCall = (callee: Expr): Expr => {
        const args: Expr[] = [];
        if (!check("RIGHT_PAREN")) {
            do {
                if (args.length >= 255) {
                    errors.push(
                        parseError(
                            peek(),
                            "Can't have more than 255 arguments."
                        )
                    );
                }
                args.push(expression());
            } while (match("COMMA"));
        }
        const paren = consume("RIGHT_PAREN", "Expect ')' after arguments.");
        return ex.call(callee, paren, args);
    };
    /**  Method for parsing a left-associative series of binary operators */
    const leftSeries = (
        exprFn: () => Expr,
        matchTypes: TokenType[],
        type: "binary" | "logical"
    ) => {
        let expr = exprFn();
        while (match(...matchTypes)) {
            expr =
                type === "binary"
                    ? ex.binary(expr, previous(), exprFn())
                    : ex.logical(expr, previous(), exprFn());
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
