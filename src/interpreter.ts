import { createEnvironment, type Environment } from "./core/environment";
import { BreakError, breakError, runtimeError } from "./core/error";
import type {
    AssignmentExpr,
    BinaryExpr,
    Expr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    UnaryExpr,
    VariableExpr,
} from "./core/expressions";
import type {
    BlockStmt,
    BreakStmt,
    ExprStmt,
    IfStmt,
    PrintStmt,
    Stmt,
    VarDeclStmt,
    WhileStmt,
} from "./core/statements";
import type { Literal, Token } from "./core/token";
import { color } from "./lib/colors";
import { stringify } from "./lib/stringify";

export interface InterpreterOptions {
    /**
     * Whether to print the result of the expression to the console.
     */
    repl?: boolean;
    /**
     * The environment to use for the interpreter.
     */
    environment?: Environment;
}

export function interpret(statements: Stmt[], options?: InterpreterOptions) {
    const { repl = false, environment = createEnvironment() } = options ?? {};

    for (const statement of statements) {
        let value = executeStmt(statement, environment);
        if (repl && value !== undefined) {
            const stringValue = stringify(value);
            console.log(color("darkgray", stringValue));
        }
    }
}

const executeStmt = (stmt: Stmt, environment: Environment) => {
    switch (stmt.type) {
        case "exprStmt":
            return visitExpressionStmt(stmt, environment);
        case "ifStmt":
            return visitIfStmt(stmt, environment);
        case "printStmt":
            return visitPrintStmt(stmt, environment);
        case "varDecl":
            return visitVarDeclStmt(stmt, environment);
        case "block":
            return visitBlockStmt(stmt, environment);
        case "whileStmt":
            return visitWhileStmt(stmt, environment);
        case "breakStmt":
            return visitBreakStmt(stmt);
    }
};

const visitBlockStmt = (stmt: BlockStmt, enclosing: Environment) => {
    const scope = createEnvironment(enclosing);
    for (const statement of stmt.statements) {
        executeStmt(statement, scope);
    }
    return undefined;
};

const visitExpressionStmt = (expr: ExprStmt, environment: Environment) => {
    return evaluateExpr(expr.expression, environment);
};

const visitIfStmt = (stmt: IfStmt, environment: Environment) => {
    const condition = evaluateExpr(stmt.condition, environment);
    if (isTruthy(condition)) {
        executeStmt(stmt.thenBranch, environment);
    } else if (stmt.elseBranch) {
        executeStmt(stmt.elseBranch, environment);
    }
    return undefined;
};

const visitPrintStmt = (expr: PrintStmt, environment: Environment) => {
    const value = evaluateExpr(expr.expression, environment);
    console.log(stringify(value));
    return undefined;
};

const visitVarDeclStmt = (stmt: VarDeclStmt, environment: Environment) => {
    const value =
        stmt.initializer === null
            ? null
            : evaluateExpr(stmt.initializer, environment);
    environment.define(stmt.name, value);
    return undefined;
};

const visitWhileStmt = (stmt: WhileStmt, environment: Environment) => {
    while (isTruthy(evaluateExpr(stmt.condition, environment))) {
        try {
            executeStmt(stmt.body, environment);
        } catch (error) {
            if (error instanceof BreakError) {
                return undefined;
            }
            throw error;
        }
    }
    return undefined;
};

const visitBreakStmt = (stmt: BreakStmt) => {
    throw breakError(stmt.operator, "Break outside of loop.");
};

function evaluateExpr(ast: Expr, environment: Environment): Literal {
    switch (ast.type) {
        case "literal":
            return visitLiteral(ast);
        case "grouping":
            return visitGrouping(ast, environment);
        case "unary":
            return visitUnary(ast, environment);
        case "binary":
            return visitBinary(ast, environment);
        case "logical":
            return visitLogical(ast, environment);
        case "variable":
            return visitVariable(ast, environment);
        case "assignment":
            return visitAssignment(ast, environment);
    }
}

const visitAssignment = (expr: AssignmentExpr, environment: Environment) => {
    const value = evaluateExpr(expr.value, environment);
    environment.assign(expr.name, value);
    return value;
};

const visitLogical = (expr: LogicalExpr, environment: Environment) => {
    const left = evaluateExpr(expr.left, environment);

    if (expr.operator.type === "OR") {
        if (isTruthy(left)) return left;
    } else {
        if (!isTruthy(left)) return left;
    }

    return evaluateExpr(expr.right, environment);
};

const visitVariable = (expr: VariableExpr, environment: Environment) =>
    environment.get(expr.name);

const visitLiteral = (expr: LiteralExpr) => expr.value;

const visitGrouping = (expr: GroupingExpr, environment: Environment) =>
    evaluateExpr(expr.expression, environment);

const visitUnary = (expr: UnaryExpr, environment: Environment) => {
    const right = evaluateExpr(expr.right, environment);

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

const visitBinary = (expr: BinaryExpr, environment: Environment) => {
    const left = evaluateExpr(expr.left, environment);
    const right = evaluateExpr(expr.right, environment);

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
            const leftDiv = ensureNumber(left, expr.operator);
            const rightDiv = ensureNumber(right, expr.operator);
            if (rightDiv === 0) {
                throw runtimeError(expr.operator, "Division by zero");
            }
            return leftDiv / rightDiv;
        case "STAR":
            return (
                ensureNumber(left, expr.operator) *
                ensureNumber(right, expr.operator)
            );
        case "PERCENT":
            const leftNum = ensureNumber(left, expr.operator);
            const rightNum = ensureNumber(right, expr.operator);
            if (rightNum === 0) {
                throw runtimeError(expr.operator, "Division by zero");
            }
            return leftNum % rightNum;
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
