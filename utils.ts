import type { SKRSContext2D } from "@napi-rs/canvas";

export async function readFileLines(
  filePath: string,
  onLineRead: (line: string | undefined) => void,
  onFinish: () => void
) {
  const stream = Bun.file(filePath).stream();
  const decoder = new TextDecoder();

  let remainingData = "";

  // @ts-ignore
  for await (const chunk of stream) {
    const str = decoder.decode(chunk);

    remainingData += str;
    let lines = remainingData.split(/\r?\n/);
    while (lines.length > 1) {
      onLineRead(lines.shift());
    }

    remainingData = lines[0];
  }

  return onFinish();
}

export function cirlceFill(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
