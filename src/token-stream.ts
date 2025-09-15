import { type Token } from "./token";

export interface TokenStream {
    peek(k?: number): Token;
    advance(): Token;
    previous(): Token;
    isAtEnd(): boolean;
}

export function fromArray(tokens: Token[]): TokenStream {
    let index = 0;
    let last: Token | undefined;

    const peek = (k = 0) => {
        const i = index + k;
        const t = tokens[i];
        if (!t)
            throw new Error(
                `Token index out of range: ${i} (last is ${tokens.length - 1})`
            );
        return t;
    };

    return {
        peek,
        advance() {
            last = peek(0);
            index++;
            return last;
        },
        previous() {
            if (!last) throw new Error("No previous token");
            return last;
        },
        isAtEnd() {
            return peek(0).type === "EOF";
        },
    };
}

export function fromIterable(iterable: Iterable<Token>): TokenStream {
    const it = iterable[Symbol.iterator]();
    const buffer: Token[] = [];
    let index = 0;
    let done = false;
    let last: Token | undefined;

    const fillUntil = (i: number) => {
        while (!done && i >= buffer.length) {
            const n = it.next();
            done = !!n.done;
            if (!done) buffer.push(n.value);
        }
    };

    const peek = (k = 0) => {
        const i = index + k;
        fillUntil(i);
        const t = buffer[i];
        if (!t)
            throw new Error(
                `Token index out of range while reading generator at ${i}`
            );
        return t;
    };

    return {
        peek,
        advance() {
            const cur = peek(0);
            last = cur;
            index++;
            return cur;
        },
        previous() {
            if (!last) throw new Error("No previous token");
            return last;
        },
        isAtEnd() {
            return peek(0).type === "EOF";
        },
    };
}
