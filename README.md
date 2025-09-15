# BunLox

A Lox interpreter implemented in TypeScript on top of the Bun runtime. This is a study project following the excellent book Crafting Interpreters by Bob Nystrom, adapted to Bun and TypeScript.

Reference: [Crafting Interpreters](https://craftinginterpreters.com)

---

## Status
- Scanner (lexer): implemented with support for single- and two-character operators, strings, numbers, identifiers, and keywords
- Parser: expression grammar producing an AST (equality, comparison, term, factor, unary, primary)
- Interpreter: evaluates expressions (arithmetic, comparison, equality, unary `!`/`-`, `+` for numbers and string concatenation)
- Stringified output: pretty printing with simple colors in the terminal
- AST printer: available for debugging
- REPL: interactive prompt with simple commands

What’s not implemented yet:
- Statements, declarations, and full program parsing (e.g., `print`, `var`, blocks), control flow, functions, classes, resolver, and environments

---

## Requirements
- Bun v1.2.20+ installed

Check your Bun version:
```bash
bun --version
```

## Install
```bash
bun install
```

## Run
You can run a REPL or evaluate a `.lox` file.

### REPL
```bash
# Either
bun run src/index.ts

# or via npm script
bun run start
```

REPL commands:
- `.help`  show help
- `.clear` clear the screen
- `.exit`  exit the REPL

Example REPL session (now evaluates expressions):
```text
> (-123) * (45.67)
-5617.41
> !true == false
true
> "hello" + " " + "world"
"hello world"
> 1 + 2 * 3 == 7
true
```

### Run a file
```bash
bun run src/index.ts path/to/program.lox
```

Note: At this stage, only expressions are parsed and evaluated. Statement keywords like `print` are tokenized by the scanner but not yet parsed/executed.

---

## Tests
This project uses Bun’s built-in test runner.
```bash
bun test
```

Sample specs:
- `src/lib/ast-printer.spec.ts`
- `src/scanner.spec.ts`
- `src/parser.spec.ts`

---

## Project Structure
- `src/index.ts` — CLI entry point (file runner and REPL)
- `src/scanner.ts` — lexer producing tokens from source
- `src/parser.ts` — expression parser building an AST
- `src/expressions.ts` — AST node types and constructors
- `src/interpreter.ts` — evaluates AST nodes and prints results
- `src/lib/stringify.ts` — stringifies evaluated values (with basic colors)
- `src/lib/ast-printer.ts` — prints AST in prefix form
- `src/token.ts`, `src/token-types.ts`, `src/token-keywords.ts` — token model and definitions
- `src/error.ts` — error types for scanning/parsing
- `playground/` — example inputs

You’ll also see lightweight timing of phases (scan/parse) via `src/lib/measure.ts` when running code.

---

## Development
Suggested workflow:
1) Make changes
2) Run the REPL or a file to see output
3) Run tests

```bash
# REPL
bun run src/index.ts

# Run a file
bun run src/index.ts path/to/file.lox

# Tests
bun test
```

---

## Roadmap (high-level)
- Add statement grammar (e.g., `print`, `var`, blocks)
- Implement interpreter runtime with environments and evaluation
- Add error recovery and synchronization across statements
- Extend tests to cover parser and interpreter behaviors

---

## Acknowledgements
- Bob Nystrom — Crafting Interpreters
- The Bun team for a fast TypeScript/JavaScript runtime

This project was bootstrapped with `bun init` on Bun v1.2.20.
