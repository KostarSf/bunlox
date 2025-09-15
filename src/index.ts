import { LoxError } from "./error";
import { printAst } from "./lib/ast-printer";
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
        } else {
            console.error(error);
        }
    }
}

async function runPrompt() {
    console.log("Welcome to BunLox v0.1.0.");
    console.log('Type ".help" for more information.');

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
            await run(line);
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

async function run(source: string) {
    const scanMeasureFinish = measure("Scan tokens");
    const tokens = scanTokens(source);
    scanMeasureFinish();

    const parseMeasureFinish = measure("Parse tokens");
    const ast = parseAst(tokens);
    parseMeasureFinish();

    console.log(printAst(ast));
}
