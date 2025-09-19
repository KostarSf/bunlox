import { LoxError, parseError } from "./core/error";
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
import type { Token } from "./core/token";

type DefinedType = "defined" | "not_defined" | "not_declared";

interface Scope {
    /** Push a new scope onto the stack. */
    push: (type: ScopeType) => void;
    /** Pop the current scope off the stack. */
    pop: () => void;
    /** Mark a variable as declared in the scope. */
    declare: (name: Token) => void;
    /** Mark that declared variable has been defined in the scope. */
    define: (name: Token) => void;
    /** Get the defined state of a variable in the scope. */
    get: (name: Token) => DefinedType;
}

type ScopeType = "global" | "function" | "loop";

interface Resolver {
    scope: Scope;
    errors: LoxError[];
    resolveLocal: (expr: Expr, name: Token) => void;
    locals: Map<Expr, number>;
}

const createResolver = (): Resolver => {
    const errors: LoxError[] = [];

    const scopes: { type: ScopeType; vars: Map<string, boolean> }[] = [];
    const getScope = () => scopes[scopes.length - 1];

    const scope: Scope = {
        push: (type) => scopes.push({ type, vars: new Map() }),
        pop: () => scopes.pop(),
        declare: (name: Token) => {
            const scope = getScope();
            if (!scope) return;

            if (scope.vars.has(name.lexeme)) {
                errors.push(
                    parseError(
                        name,
                        `Variable with name '${name.lexeme}' already declared in this scope.`
                    )
                );
            }

            scope.vars.set(name.lexeme, false);
        },
        define: (name: Token) => {
            const scope = getScope();
            if (scope) scope.vars.set(name.lexeme, true);
        },
        get: (name: Token) => {
            const scope = getScope();
            if (scope) {
                const state = scope.vars.get(name.lexeme);
                if (state === undefined) return "not_declared";
                return state ? "defined" : "not_defined";
            }
            return "not_declared";
        },
    };

    const locals = new Map<Expr, number>();
    const resolve = (expr: Expr, depth: number) => locals.set(expr, depth);
    const resolveLocal = (expr: Expr, name: Token) => {
        for (let i = scopes.length - 1; i >= 0; i--) {
            if (scopes[i]?.vars.has(name.lexeme)) {
                resolve(expr, scopes.length - 1 - i);
                return;
            }
        }
    };

    return { scope, errors: [], locals, resolveLocal };
};

export function resolve(statements: Stmt[]) {
    const resolver = createResolver();
    resolveStmts(statements, "global", resolver);

    if (resolver.errors.length > 0) {
        throw new LoxError("Resolver error", resolver.errors);
    }

    return { locals: resolver.locals };
}

const resolveStmts = (
    statements: Stmt[],
    type: ScopeType,
    resolver: Resolver
) => {
    for (const statement of statements) {
        switch (statement.type) {
            case "block":
                visitBlockStmt(statement, type, resolver);
                break;
            case "varDecl":
                visitVarDeclStmt(statement, resolver);
                break;
            case "function":
                visitFunctionStmt(statement, resolver);
                break;
            case "exprStmt":
                visitExprStmt(statement, resolver);
                break;
            case "ifStmt":
                visitIfStmt(statement, type, resolver);
                break;
            case "whileStmt":
                visitWhileStmt(statement, resolver);
                break;
            case "breakStmt":
                visitBreakStmt(statement, type, resolver);
                break;
            case "returnStmt":
                visitReturnStmt(statement, type, resolver);
                break;
            case "printStmt":
                visitPrintStmt(statement, resolver);
                break;
        }
    }
};

const visitBlockStmt = (
    stmt: BlockStmt,
    type: ScopeType,
    resolver: Resolver
) => {
    resolver.scope.push(type);
    resolveStmts(stmt.statements, type, resolver);
    resolver.scope.pop();
};

const visitVarDeclStmt = (stmt: VarDeclStmt, resolver: Resolver) => {
    resolver.scope.declare(stmt.name);
    if (stmt.initializer !== null) {
        resolveExpr(stmt.initializer, resolver);
    }
    resolver.scope.define(stmt.name);
};

const visitFunctionStmt = (stmt: FunctionStmt, resolver: Resolver) => {
    resolver.scope.declare(stmt.name);
    resolver.scope.define(stmt.name);

    resolveFunction(stmt, resolver, "function");
};

const resolveFunction = (
    func: FunctionStmt | FunctionExpr,
    resolver: Resolver,
    type: ScopeType
) => {
    resolver.scope.push(type);
    for (const parameter of func.parameters) {
        resolver.scope.declare(parameter);
        resolver.scope.define(parameter);
    }
    resolveStmts(func.body, type, resolver);
    resolver.scope.pop();
};

const visitExprStmt = (stmt: ExprStmt, resolver: Resolver) => {
    resolveExpr(stmt.expression, resolver);
};

const visitIfStmt = (stmt: IfStmt, type: ScopeType, resolver: Resolver) => {
    resolveExpr(stmt.condition, resolver);
    resolveStmts([stmt.thenBranch], type, resolver);
    if (stmt.elseBranch !== null) {
        resolveStmts([stmt.elseBranch], type, resolver);
    }
};

const visitWhileStmt = (stmt: WhileStmt, resolver: Resolver) => {
    resolveExpr(stmt.condition, resolver);
    resolveStmts([stmt.body], "loop", resolver);
};

const visitBreakStmt = (
    stmt: BreakStmt,
    type: ScopeType,
    resolver: Resolver
) => {
    if (type !== "loop") {
        resolver.errors.push(
            parseError(stmt.operator, "Can't break outside of a loop.")
        );
    }
};

const visitPrintStmt = (stmt: PrintStmt, resolver: Resolver) => {
    resolveExpr(stmt.expression, resolver);
};

const visitReturnStmt = (
    stmt: ReturnStmt,
    type: ScopeType,
    resolver: Resolver
) => {
    if (type === "global") {
        resolver.errors.push(
            parseError(stmt.keyword, "Can't return from top-level code.")
        );
    }

    if (stmt.value !== null) {
        resolveExpr(stmt.value, resolver);
    }
};

const resolveExpr = (expr: Expr, resolver: Resolver) => {
    switch (expr.type) {
        case "literal":
            visitLiteral(expr, resolver);
            break;
        case "grouping":
            visitGrouping(expr, resolver);
            break;
        case "unary":
            visitUnary(expr, resolver);
            break;
        case "binary":
            visitBinary(expr, resolver);
            break;
        case "logical":
            visitLogical(expr, resolver);
            break;
        case "variable":
            visitVariable(expr, resolver);
            break;
        case "assignment":
            visitAssignment(expr, resolver);
            break;
        case "call":
            visitCall(expr, resolver);
            break;
        case "anonymousFunction":
            visitFunction(expr, resolver);
            break;
    }
};

const visitVariable = (expr: VariableExpr, resolver: Resolver) => {
    if (resolver.scope.get(expr.name) === "not_defined") {
        resolver.errors.push(
            parseError(
                expr.name,
                "Can't read local variable in its own initializer."
            )
        );
    }
    resolver.resolveLocal(expr, expr.name);
};

const visitAssignment = (expr: AssignmentExpr, resolver: Resolver) => {
    resolveExpr(expr.value, resolver);
    resolver.resolveLocal(expr, expr.name);
};

const visitCall = (expr: CallExpr, resolver: Resolver) => {
    resolveExpr(expr.callee, resolver);
    for (const arg of expr.args) {
        resolveExpr(arg, resolver);
    }
};

const visitGrouping = (expr: GroupingExpr, resolver: Resolver) => {
    resolveExpr(expr.expression, resolver);
};

const visitLiteral = (expr: LiteralExpr, resolver: Resolver) => {};

const visitBinary = (expr: BinaryExpr, resolver: Resolver) => {
    resolveExpr(expr.left, resolver);
    resolveExpr(expr.right, resolver);
};

const visitLogical = (expr: LogicalExpr, resolver: Resolver) => {
    resolveExpr(expr.left, resolver);
    resolveExpr(expr.right, resolver);
};

const visitUnary = (expr: UnaryExpr, resolver: Resolver) => {
    resolveExpr(expr.right, resolver);
};

const visitFunction = (expr: FunctionExpr, resolver: Resolver) => {
    resolveFunction(expr, resolver, "function");
};
