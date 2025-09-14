import type { Token, Literal } from "./token";

export type Expr =
    | {
          type: "binary";
          left: Expr;
          operator: Token;
          right: Expr;
      }
    | {
          type: "grouping";
          expression: Expr;
      }
    | {
          type: "literal";
          value: Literal;
      }
    | {
          type: "unary";
          operator: Token;
          right: Expr;
      };

export const binary = (left: Expr, operator: Token, right: Expr) =>
    ({ type: "binary", left, operator, right } satisfies Expr);

export const grouping = (expression: Expr) =>
    ({ type: "grouping", expression } satisfies Expr);

export const literal = (value: Literal) =>
    ({ type: "literal", value } satisfies Expr);

export const unary = (operator: Token, right: Expr) =>
    ({ type: "unary", operator, right } satisfies Expr);
