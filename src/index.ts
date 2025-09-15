import { LoxError } from "./error";
import { printAst } from "./lib/ast-printer";
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
    console.log("Type \".exit\" or use Ctrl+C to quit.");

    process.stdout.write("> ");
    for await (const line of console) {
        if (line === ".exit") break;
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
    const tokens = Array.from(scanTokens(source));
    const ast = parseAst(tokens);
    console.log(printAst(ast));
}
