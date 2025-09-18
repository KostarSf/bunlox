import type { Expr } from "../core/expressions";
import * as ex from "../core/expressions";
import type { Stmt } from "../core/statements";

export function printAst(exprOrStmt: Expr | Stmt[]): string {
    if (Array.isArray(exprOrStmt)) {
        const statements: string[] = [];

        for (const stmt of exprOrStmt) {
            switch (stmt.type) {
                case "exprStmt":
                    statements.push(printExpr(stmt.expression));
                    break;
                case "printStmt":
                    statements.push(`(print ${printExpr(stmt.expression)})`);
                    break;
                case "varDecl":
                    statements.push(
                        `(var ${stmt.name.lexeme} ${printExpr(
                            stmt.initializer ?? ex.literal(null)
                        )})`
                    );
                    break;
                case "block":
                    statements.push(`(block ${printAst(stmt.statements)})`);
                    break;
                case "ifStmt":
                    statements.push(
                        `(if ${printAst(stmt.condition)} then ${printAst([
                            stmt.thenBranch,
                        ])}${
                            stmt.elseBranch
                                ? ` else ${printAst([stmt.elseBranch])}`
                                : ""
                        })`
                    );
                    break;
                case "whileStmt":
                    statements.push(
                        `(while ${printAst(stmt.condition)} then ${printAst([
                            stmt.body,
                        ])})`
                    );
                    break;
                case "breakStmt":
                    statements.push("(break)");
                    break;
            }
        }

        return statements.join("\n");
    }

    return printExpr(exprOrStmt);
}

function printExpr(expr: Expr): string {
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
        case "variable":
            return `(${expr.name.lexeme})`;
        case "assignment":
            return `(${expr.name.lexeme} = ${printAst(expr.value)})`;
        case "logical":
            return `(${expr.operator.lexeme} ${printAst(expr.left)} ${printAst(
                expr.right
            )})`;
        case "call":
            return `(${printAst(expr.callee)} [${expr.args
                .map(printExpr)
                .join(", ")}])`;
        case "function":
            return `(${expr.name.lexeme} [${expr.parameters
                .map((param) => param.lexeme)
                .join(", ")}] ${expr.body.map(printExpr).join(" ")})`;
    }
}
