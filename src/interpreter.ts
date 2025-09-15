import { runtimeError } from "./error";
import type {
    BinaryExpr,
    Expr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
} from "./expressions";
import { stringify } from "./lib/stringify";
import type { Literal, Token } from "./token";

export function interpret(ast: Expr) {
    const value = evaluate(ast);
    console.log(stringify(value));
}

function evaluate(ast: Expr): Literal {
    switch (ast.type) {
        case "literal":
            return visitLiteral(ast);
        case "grouping":
            return visitGrouping(ast);
        case "unary":
            return visitUnary(ast);
        case "binary":
            return visitBinary(ast);
    }
}

const visitLiteral = (expr: LiteralExpr) => expr.value;

const visitGrouping = (expr: GroupingExpr) => evaluate(expr.expression);

const visitUnary = (expr: UnaryExpr) => {
    const right = evaluate(expr.right);

    switch (expr.operator.type) {
        case "MINUS":
            return -ensureNumber(right, expr.operator);
        case "BANG":
            return !isTruthy(right);
    }

    throw runtimeError(
        expr.operator,
        `Unknown unary operator: ${expr.operator.type}`
    );
};

const ensureNumber = (value: unknown, operator: Token) => {
    if (typeof value !== "number") {
        throw runtimeError(
            operator,
            `Operand of ${operator.lexeme} must be a number`
        );
    }
    return value;
};

const isTruthy = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    return true;
};

const visitBinary = (expr: BinaryExpr) => {
    const left = evaluate(expr.left);
    const right = evaluate(expr.right);

    switch (expr.operator.type) {
        case "GREATER":
            return (
                ensureNumber(left, expr.operator) >
                ensureNumber(right, expr.operator)
            );
        case "GREATER_EQUAL":
            return (
                ensureNumber(left, expr.operator) >=
                ensureNumber(right, expr.operator)
            );
        case "LESS":
            return (
                ensureNumber(left, expr.operator) <
                ensureNumber(right, expr.operator)
            );
        case "LESS_EQUAL":
            return (
                ensureNumber(left, expr.operator) <=
                ensureNumber(right, expr.operator)
            );
        case "MINUS":
            return (
                ensureNumber(left, expr.operator) -
                ensureNumber(right, expr.operator)
            );
        case "SLASH":
            return (
                ensureNumber(left, expr.operator) /
                ensureNumber(right, expr.operator)
            );
        case "STAR":
            return (
                ensureNumber(left, expr.operator) *
                ensureNumber(right, expr.operator)
            );
        case "PLUS":
            if (typeof left === "number" && typeof right === "number") {
                return left + right;
            }
            if (typeof left === "string" && typeof right === "string") {
                return left + right;
            }
            throw runtimeError(
                expr.operator,
                `Operands of ${expr.operator.lexeme} must be two numbers or two strings`
            );
        case "EQUAL_EQUAL":
            return isEqual(left, right);
        case "BANG_EQUAL":
            return !isEqual(left, right);
    }

    throw runtimeError(
        expr.operator,
        `Unknown binary operator: ${expr.operator.type}`
    );
};

const isEqual = (a: unknown, b: unknown) => {
    if (a === null || a === undefined) return b === null || b === undefined;
    return a === b;
};
