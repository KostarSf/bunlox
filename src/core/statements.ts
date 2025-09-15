import type { Expr } from "./expressions";
import type { Token } from "./token";

export type ExprStmt = {
    type: "exprStmt";
    expression: Expr;
};

export type PrintStmt = {
    type: "printStmt";
    expression: Expr;
};

export type VarDeclStmt = {
    type: "varDecl";
    name: Token;
    initializer: Expr | null;
};

export type Stmt = ExprStmt | PrintStmt | VarDeclStmt;

export const expr = (expression: Expr) =>
    ({ type: "exprStmt", expression } satisfies ExprStmt);

export const print = (expression: Expr) =>
    ({ type: "printStmt", expression } satisfies PrintStmt);

export const varDecl = (name: Token, initializer: Expr | null) =>
    ({ type: "varDecl", name, initializer } satisfies VarDeclStmt);
