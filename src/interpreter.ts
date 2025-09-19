import { createEnvironment, type Environment } from "./core/environment";
import {
    BreakError,
    breakError,
    returnError,
    runtimeError,
} from "./core/error";
import type {
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    FunctionExpr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    UnaryExpr,
    VariableExpr,
} from "./core/expressions";
import type { Literal } from "./core/literal";
import { createFunction, isCallable } from "./core/literal";
import type {
    BlockStmt,
    BreakStmt,
    ExprStmt,
    FunctionStmt,
    IfStmt,
    PrintStmt,
    ReturnStmt,
    Stmt,
    VarDeclStmt,
    WhileStmt,
} from "./core/statements";
import { type Token } from "./core/token";
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
    /**
     * The resolved locals to use for the interpreter.
     */
    locals?: Map<Expr, number>;
}

interface Context {
    environment: Environment;
    locals: Map<Expr, number>;
}

export function interpret(statements: Stmt[], options?: InterpreterOptions) {
    const {
        repl = false,
        environment = createEnvironment(),
        locals = new Map(),
    } = options ?? {};

    const context: Context = { environment, locals };

    for (const statement of statements) {
        let value = executeStmt(statement, context);
        if (repl && value !== undefined) {
            const stringValue = stringify(value);
            console.log(color("darkgray", stringValue));
        }
    }
}

const executeStmt = (stmt: Stmt, context: Context) => {
    switch (stmt.type) {
        case "exprStmt":
            return visitExpressionStmt(stmt, context);
        case "ifStmt":
            return visitIfStmt(stmt, context);
        case "printStmt":
            return visitPrintStmt(stmt, context);
        case "varDecl":
            return visitVarDeclStmt(stmt, context);
        case "block":
            return visitBlockStmt(stmt, context);
        case "whileStmt":
            return visitWhileStmt(stmt, context);
        case "breakStmt":
            return visitBreakStmt(stmt);
        case "function":
            return visitFunctionStmt(stmt, context);
        case "returnStmt":
            return visitReturnStmt(stmt, context);
    }
};

const visitReturnStmt = (expr: ReturnStmt, context: Context) => {
    const value =
        expr.value === null ? null : evaluateExpr(expr.value, context);
    throw returnError(expr.keyword, value);
};

const visitFunctionStmt = (stmt: FunctionStmt, context: Context) => {
    const fun = createFunction(
        stmt,
        context.environment,
        (declaration, enclosing) =>
            executeBlock(declaration.body, {
                ...context,
                environment: enclosing,
            })
    );
    context.environment.define(stmt.name, fun);
    return undefined;
};

const visitBlockStmt = (stmt: BlockStmt, context: Context) => {
    return executeBlock(stmt.statements, context);
};

const executeBlock = (statements: Stmt[], context: Context) => {
    const scopeContext: Context = {
        ...context,
        environment: createEnvironment(context.environment),
    };
    for (const statement of statements) {
        executeStmt(statement, scopeContext);
    }
    return undefined;
};

const visitExpressionStmt = (expr: ExprStmt, context: Context) => {
    return evaluateExpr(expr.expression, context);
};

const visitIfStmt = (stmt: IfStmt, context: Context) => {
    const condition = evaluateExpr(stmt.condition, context);
    if (isTruthy(condition)) {
        executeStmt(stmt.thenBranch, context);
    } else if (stmt.elseBranch) {
        executeStmt(stmt.elseBranch, context);
    }
    return undefined;
};

const visitPrintStmt = (expr: PrintStmt, context: Context) => {
    const value = evaluateExpr(expr.expression, context);
    console.log(stringify(value));
    return undefined;
};

const visitVarDeclStmt = (stmt: VarDeclStmt, context: Context) => {
    const value =
        stmt.initializer === null
            ? null
            : evaluateExpr(stmt.initializer, context);
    context.environment.define(stmt.name, value);
    return undefined;
};

const visitWhileStmt = (stmt: WhileStmt, context: Context) => {
    while (isTruthy(evaluateExpr(stmt.condition, context))) {
        try {
            executeStmt(stmt.body, context);
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

function evaluateExpr(ast: Expr, context: Context): Literal {
    switch (ast.type) {
        case "literal":
            return visitLiteral(ast);
        case "grouping":
            return visitGrouping(ast, context);
        case "unary":
            return visitUnary(ast, context);
        case "binary":
            return visitBinary(ast, context);
        case "logical":
            return visitLogical(ast, context);
        case "variable":
            return visitVariable(ast, context);
        case "assignment":
            return visitAssignment(ast, context);
        case "call":
            return visitCall(ast, context);
        case "anonymousFunction":
            return visitFunction(ast, context);
    }
}

const visitFunction = (expr: FunctionExpr, context: Context) => {
    return createFunction(expr, context.environment, (declaration, enclosing) =>
        executeBlock(declaration.body, { ...context, environment: enclosing })
    );
};

const visitAssignment = (expr: AssignmentExpr, context: Context) => {
    const value = evaluateExpr(expr.value, context);

    const distance = context.locals.get(expr);
    context.environment.assign(expr.name, value, distance);

    return value;
};

const visitCall = (expr: CallExpr, context: Context) => {
    const callee = evaluateExpr(expr.callee, context);
    const args = expr.args.map((arg) => evaluateExpr(arg, context));
    if (!isCallable(callee)) {
        throw runtimeError(expr.paren, "Can only call functions and classes.");
    }
    if (args.length !== callee.arity) {
        throw runtimeError(
            expr.paren,
            `Expected ${callee.arity} arguments but got ${args.length}.`
        );
    }
    return callee.call(args, context.environment);
};

const visitLogical = (expr: LogicalExpr, context: Context) => {
    const left = evaluateExpr(expr.left, context);

    if (expr.operator.type === "OR") {
        if (isTruthy(left)) return left;
    } else {
        if (!isTruthy(left)) return left;
    }

    return evaluateExpr(expr.right, context);
};

const visitVariable = (expr: VariableExpr, context: Context) => {
    return lookUpVariable(expr.name, expr, context);
};

const lookUpVariable = (name: Token, expr: Expr, context: Context) => {
    const distance = context.locals.get(expr);
    return context.environment.get(name, distance);
};

const visitLiteral = (expr: LiteralExpr) => expr.value;

const visitGrouping = (expr: GroupingExpr, context: Context) => {
    return evaluateExpr(expr.expression, context);
};

const visitUnary = (expr: UnaryExpr, context: Context) => {
    const right = evaluateExpr(expr.right, context);

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

const ensureNumber = (value: Literal, operator: Token) => {
    if (typeof value !== "number") {
        throw runtimeError(
            operator,
            `Operand of ${operator.lexeme} must be a number`
        );
    }
    return value;
};

const isTruthy = (value: Literal) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    return true;
};

const visitBinary = (expr: BinaryExpr, context: Context) => {
    const left = evaluateExpr(expr.left, context);
    const right = evaluateExpr(expr.right, context);

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

const isEqual = (a: Literal, b: Literal) => {
    if (a === null || a === undefined) return b === null || b === undefined;
    return a === b;
};
