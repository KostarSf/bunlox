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

export interface IfStmt {
    type: "ifStmt";
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: Stmt | null;
}

export type Stmt = ExprStmt | PrintStmt | VarDeclStmt | BlockStmt | IfStmt;

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
