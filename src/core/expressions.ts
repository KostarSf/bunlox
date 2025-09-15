import type { Literal, Token } from "./token";

export type LiteralExpr = {
    type: "literal";
    value: Literal;
};

export type GroupingExpr = {
    type: "grouping";
    expression: Expr;
};

export type BinaryExpr = {
    type: "binary";
    left: Expr;
    operator: Token;
    right: Expr;
};

export type UnaryExpr = {
    type: "unary";
    operator: Token;
    right: Expr;
};

export type VariableExpr = {
    type: "variable";
    name: Token;
};

export type Expr =
    | LiteralExpr
    | GroupingExpr
    | BinaryExpr
    | UnaryExpr
    | VariableExpr;

export const binary = (left: Expr, operator: Token, right: Expr) =>
    ({ type: "binary", left, operator, right } satisfies BinaryExpr);

export const grouping = (expression: Expr) =>
    ({ type: "grouping", expression } satisfies GroupingExpr);

export const literal = (value: Literal) =>
    ({ type: "literal", value } satisfies LiteralExpr);

export const unary = (operator: Token, right: Expr) =>
    ({ type: "unary", operator, right } satisfies UnaryExpr);

export const variable = (name: Token) =>
    ({ type: "variable", name } satisfies VariableExpr);
