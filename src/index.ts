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
    await run(content);
}

async function runPrompt() {
    process.stdout.write("> ");
    for await (const line of console) {
        if (line === "exit") break;
        await run(line);
        process.stdout.write("> ");
    }
}

async function run(source: string) {
    const tokens = source.split(" ");
    tokens.forEach(token => {
        console.log(token);
    });
}
