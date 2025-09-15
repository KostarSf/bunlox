export function measure(label: string) {
    const start = performance.now();
    return () => {
        const end = performance.now();
        const duration = Math.round((end - start) * 10000) / 10000;

        if (Bun.env.NODE_ENV === "development") {
            console.debug(
                Bun.color("gray", "ansi"),
                `${label}: ${duration}ms`,
                Bun.color("white", "ansi")
            );
        }
    };
}
