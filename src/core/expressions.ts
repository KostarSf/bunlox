import type { Literal } from "./literal";
import type { Stmt } from "./statements";
import type { Token } from "./token";

export interface LiteralExpr {
    type: "literal";
    value: Literal;
}

export interface GroupingExpr {
    type: "grouping";
    expression: Expr;
}

export interface CallExpr {
    type: "call";
    callee: Expr;
    paren: Token;
    args: Expr[];
}

export interface BinaryExpr {
    type: "binary";
    left: Expr;
    operator: Token;
    right: Expr;
}

export interface LogicalExpr {
    type: "logical";
    left: Expr;
    operator: Token;
    right: Expr;
}

export interface UnaryExpr {
    type: "unary";
    operator: Token;
    right: Expr;
}

export interface VariableExpr {
    type: "variable";
    name: Token;
}

export interface AssignmentExpr {
    type: "assignment";
    name: Token;
    value: Expr;
}

export interface FunctionExpr {
    type: "anonymousFunction";
    parameters: Token[];
    body: Stmt[];
}

export type Expr =
    | LiteralExpr
    | GroupingExpr
    | CallExpr
    | BinaryExpr
    | LogicalExpr
    | UnaryExpr
    | VariableExpr
    | AssignmentExpr
    | FunctionExpr;

export const binary = (left: Expr, operator: Token, right: Expr) =>
    ({ type: "binary", left, operator, right } satisfies BinaryExpr);

export const call = (callee: Expr, paren: Token, args: Expr[]) =>
    ({ type: "call", callee, paren, args } satisfies CallExpr);

export const logical = (left: Expr, operator: Token, right: Expr) =>
    ({ type: "logical", left, operator, right } satisfies LogicalExpr);

export const grouping = (expression: Expr) =>
    ({ type: "grouping", expression } satisfies GroupingExpr);

export const literal = (value: Literal) =>
    ({ type: "literal", value } satisfies LiteralExpr);

export const unary = (operator: Token, right: Expr) =>
    ({ type: "unary", operator, right } satisfies UnaryExpr);

export const variable = (name: Token) =>
    ({ type: "variable", name } satisfies VariableExpr);

export const assignment = (name: Token, value: Expr) =>
    ({ type: "assignment", name, value } satisfies AssignmentExpr);

export const functionExpr = (parameters: Token[], body: Stmt[]) =>
    ({ type: "anonymousFunction", parameters, body } satisfies FunctionExpr);
