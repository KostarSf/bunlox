import type { Expr } from "../expressions";

export function printAst(expr: Expr): string {
    switch (expr.type) {
        case "binary":
            return `(${expr.operator.lexeme} ${printAst(expr.left)} ${printAst(
                expr.right
            )})`;
        case "grouping":
            return `(group ${printAst(expr.expression)})`;
        case "literal":
            return expr.value?.toString() ?? "nil";
        case "unary":
            return `(${expr.operator.lexeme} ${printAst(expr.right)})`;
    }
}
