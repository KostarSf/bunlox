import { createEnvironment } from "./core/environment";
import { runtimeError } from "./core/error";
import type {
    AssignmentExpr,
    BinaryExpr,
    Expr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    VariableExpr,
} from "./core/expressions";
import type { ExprStmt, PrintStmt, Stmt, VarDeclStmt } from "./core/statements";
import type { Literal, Token } from "./core/token";
import { color } from "./lib/colors";
import { stringify } from "./lib/stringify";

const environment = createEnvironment();

export function interpret(statements: Stmt[], repl?: boolean) {
    for (const statement of statements) {
        let value = execute(statement);
        if (repl && value !== undefined) {
            const stringValue = stringify(value);
            console.log(color("darkgray", stringValue));
        }
    }
}

const execute = (stmt: Stmt) => {
    switch (stmt.type) {
        case "exprStmt":
            return visitExpressionStmt(stmt);
        case "printStmt":
            return visitPrintStmt(stmt);
        case "varDecl":
            return visitVarDeclStmt(stmt);
    }
};

const visitExpressionStmt = (expr: ExprStmt) => {
    return evaluate(expr.expression);
};

const visitPrintStmt = (expr: PrintStmt) => {
    const value = evaluate(expr.expression);
    console.log(stringify(value));
    return undefined;
};

const visitVarDeclStmt = (stmt: VarDeclStmt) => {
    const value = stmt.initializer === null ? null : evaluate(stmt.initializer);
    environment.define(stmt.name.lexeme, value);
    return undefined;
};

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
        case "variable":
            return visitVariable(ast);
        case "assignment":
            return visitAssignment(ast);
    }
}

const visitAssignment = (expr: AssignmentExpr) => {
    const value = evaluate(expr.value);
    environment.assign(expr.name, value);
    return value;
}

const visitVariable = (expr: VariableExpr) => environment.get(expr.name);

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
            const types = [typeof left, typeof right];
            if (types.every((type) => type === "number")) {
                return (left as number) + (right as number);
            }
            if (types.every((type) => type === "string" || type === "number")) {
                return `${left}${right}`;
            }

            throw runtimeError(
                expr.operator,
                `Operands of ${expr.operator.lexeme} must be numbers or strings`
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
