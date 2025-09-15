import type { Expr } from "./expressions";

export type ExprStmt = {
    type: "exprStmt";
    expression: Expr;
};

export type PrintStmt = {
    type: "printStmt";
    expression: Expr;
};

export type Stmt = ExprStmt | PrintStmt;

export const expr = (expression: Expr) =>
    ({ type: "exprStmt", expression } satisfies ExprStmt);

export const print = (expression: Expr) =>
    ({ type: "printStmt", expression } satisfies PrintStmt);
