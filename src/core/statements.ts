import type { Expr } from "./expressions";
import type { Token } from "./token";

export interface BlockStmt {
    type: "block";
    statements: Stmt[];
}

export interface ExprStmt {
    type: "exprStmt";
    expression: Expr;
}

export interface PrintStmt {
    type: "printStmt";
    expression: Expr;
}

export interface ReturnStmt {
    type: "returnStmt";
    keyword: Token;
    value: Expr | null;
}

export interface VarDeclStmt {
    type: "varDecl";
    name: Token;
    initializer: Expr | null;
}

export interface WhileStmt {
    type: "whileStmt";
    condition: Expr;
    body: Stmt;
}

export interface BreakStmt {
    type: "breakStmt";
    operator: Token;
}

export interface FunctionStmt {
    type: "function";
    name: Token;
    parameters: Token[];
    body: Stmt[];
}

export interface IfStmt {
    type: "ifStmt";
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: Stmt | null;
}

export type Stmt =
    | ExprStmt
    | PrintStmt
    | ReturnStmt
    | VarDeclStmt
    | BlockStmt
    | IfStmt
    | WhileStmt
    | BreakStmt
    | FunctionStmt;

export const expr = (expression: Expr) =>
    ({ type: "exprStmt", expression } satisfies ExprStmt);

export const print = (expression: Expr) =>
    ({ type: "printStmt", expression } satisfies PrintStmt);

export const returnStmt = (keyword: Token, value: Expr | null) =>
    ({ type: "returnStmt", keyword, value } satisfies ReturnStmt);

export const varDecl = (name: Token, initializer: Expr | null) =>
    ({ type: "varDecl", name, initializer } satisfies VarDeclStmt);

export const block = (statements: Stmt[]) =>
    ({ type: "block", statements } satisfies BlockStmt);

export const ifStmt = (
    condition: Expr,
    thenBranch: Stmt,
    elseBranch: Stmt | null
) => ({ type: "ifStmt", condition, thenBranch, elseBranch } satisfies IfStmt);

export const whileStmt = (condition: Expr, body: Stmt) =>
    ({ type: "whileStmt", condition, body } satisfies WhileStmt);

export const breakStmt = (operator: Token) =>
    ({ type: "breakStmt", operator } satisfies BreakStmt);

export const functionStmt = (name: Token, parameters: Token[], body: Stmt[]) =>
    ({ type: "function", name, parameters, body } satisfies FunctionStmt);
