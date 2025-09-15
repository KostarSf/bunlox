import { LoxError, RuntimeError } from "./core/error";
import { interpret } from "./interpreter";
import { color } from "./lib/colors";
import { measure } from "./lib/measure";
import { parseAst } from "./parser";
import { scanTokens } from "./scanner";

if (Bun.argv.length > 3) {
    console.log("Usage: bunlox <input>");
    process.exit(64);
}

if (Bun.argv.length === 3) {
    await runFile(Bun.argv[2] as string);
}

if (Bun.argv.length < 3) {
    await runPrompt();
}

async function runFile(file: string) {
    const content = await Bun.file(file).text();
    try {
        await run(content);
    } catch (error) {
        if (error instanceof LoxError) {
            console.error(error.message);

            if (error instanceof RuntimeError) {
                process.exit(70);
            }
        } else {
            console.error(error);
        }

        process.exit(65);
    }
}

async function runPrompt() {
    console.log("Welcome to BunLox v0.1.0.");
    console.log('Type ".help" for more information.');
    if (Bun.env.NODE_ENV === "development") {
        console.log(color("gray", "Debug mode enabled."));
    }

    process.stdout.write("> ");
    for await (const line of console) {
        if (line === ".exit") break;
        if (line === ".clear") {
            console.clear();
            process.stdout.write("> ");
            continue;
        }
        if (line === ".help") {
            console.log(".clear    Clear the console.");
            console.log(".exit     Exit the REPL.");
            console.log("\nPress Ctrl+C to exit the REPL.");
            process.stdout.write("> ");
            continue;
        }
        if (line === "") {
            process.stdout.write("> ");
            continue;
        }

        try {
            await run(ensureFinalSemicolon(line), true);
        } catch (error) {
            if (error instanceof LoxError) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
        process.stdout.write("> ");
    }
}

async function run(source: string, repl?: boolean) {
    const scanMeasureFinish = measure("Scan tokens");
    const tokens = scanTokens(source);
    scanMeasureFinish();

    const parseMeasureFinish = measure("Parse tokens");
    const ast = parseAst(tokens);
    parseMeasureFinish();

    const interpretMeasureFinish = measure("Interpret AST");
    interpret(ast, repl);
    interpretMeasureFinish();
}

/**
 * Ensures the line ends with a semicolon or a closing brace for REPL mode.
 */
function ensureFinalSemicolon(line: string) {
    if ([";", "}"].includes(line[line.length - 1] ?? "")) return line;
    return line + ";";
}
