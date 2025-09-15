const resetColor = Bun.color("white", "ansi");

export const color = (color: string, value: unknown) =>
    `${Bun.color(color, "ansi")}${Bun.stripANSI(String(value))}${resetColor}`;
