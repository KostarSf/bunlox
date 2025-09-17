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

export interface IfStmt {
    type: "ifStmt";
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: Stmt | null;
}

export type Stmt =
    | ExprStmt
    | PrintStmt
    | VarDeclStmt
    | BlockStmt
    | IfStmt
    | WhileStmt
    | BreakStmt;

export const expr = (expression: Expr) =>
    ({ type: "exprStmt", expression } satisfies ExprStmt);

export const print = (expression: Expr) =>
    ({ type: "printStmt", expression } satisfies PrintStmt);

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
