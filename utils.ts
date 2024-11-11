import type { SKRSContext2D } from "@napi-rs/canvas";

export class Point {
  constructor(private _x: number, private _y: number, private _label = "") {}

  public get x() {
    return this._x;
  }

  public get y() {
    return this._y;
  }

  public set x(x: number) {
    this._x = x;
  }

  public set y(y: number) {
    this._y = y;
  }

  public add(p: Point) {
    return new Point(this.x + p.x, this.y + p.y);
  }

  public sub(p: Point) {
    return new Point(this.x - p.x, this.y - p.y);
  }

  public mul(s: number) {
    return new Point(this.x * s, this.y * s);
  }

  public div(s: number) {
    return new Point(this.x / s, this.y / s);
  }

  public toString() {
    return `{x: ${this._x}, y: ${this._y}}`;
  }
}

export class Line {
  private _p1: Point;
  private _p2: Point;

  constructor(p1: Point, p2: Point, private _label = "") {
    this._p1 = new Point(p1.x, p1.y);
    this._p2 = new Point(p2.x, p2.y);
  }

  public get p1() {
    return this._p1;
  }

  public get p2() {
    return this._p2;
  }

  public set p1(p: Point) {
    this._p1 = p;
  }

  public set p2(p: Point) {
    this._p2 = p;
  }

  public add(l: Line) {
    return new Line(this.p1.add(l.p1), this.p2.add(l.p2));
  }

  public sub(l: Line) {
    return new Line(this.p1.sub(l.p1), this.p2.sub(l.p2));
  }

  public mul(s: number) {
    return new Line(this.p1.mul(s), this.p2.mul(s));
  }

  public div(s: number) {
    return new Line(this.p1.div(s), this.p2.div(s));
  }

  public moveAtP1(p: Point) {
    this.p1 = p;
    this.p2 = this.p2.sub(this.p1).add(p);
  }

  public moveAtP2(p: Point) {
    this.p2 = p;
    this.p1 = this.p1.sub(this.p2).add(p);
  }

  public length() {
    return Math.sqrt(
      Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2)
    );
  }

  public center() {
    return new Point((this.p1.x + this.p2.x) / 2, (this.p1.y + this.p2.y) / 2);
  }

  public slope() {
    if (this.p2.x - this.p1.x === 0) return undefined;
    return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
  }

  public toString() {
    return `{p1: ${this._p1}, p2: ${this._p2}}`;
  }
}

export class Circle {
  constructor(private _center: Point, private _radius: number) {}

  public get center() {
    return this._center;
  }

  public get radius() {
    return this._radius;
  }

  public set center(p: Point) {
    this._center = p;
  }

  public set radius(r: number) {
    this._radius = r;
  }
}

export function getCircleCircleIntersectionPoints(c1: Circle, c2: Circle) {
  const dx = c2.center.x - c1.center.x;
  const dy = c2.center.y - c1.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > c1.radius + c2.radius || d < Math.abs(c1.radius - c2.radius))
    return [];

  const a = (sqr(c1.radius) - sqr(c2.radius) + sqr(d)) / (2 * d);

  const x2 = c1.center.x + (dx * a) / d;
  const y2 = c1.center.y + (dy * a) / d;

  const h = Math.sqrt(sqr(c1.radius) - sqr(a));

  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  const xi = x2 + rx;
  const xi_prime = x2 - rx;
  const yi = y2 + ry;
  const yi_prime = y2 - ry;

  return [new Point(xi, yi), new Point(xi_prime, yi_prime)];
}

export function getCircleLineIntersectionPoints(c: Circle, l: Line) {
  const dx = l.p2.x - l.p1.x;
  const dy = l.p2.y - l.p1.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (dx * (l.p1.x - c.center.x) + dy * (l.p1.y - c.center.y));
  const c1 =
    sqr(l.p1.x - c.center.x) + sqr(l.p1.y - c.center.y) - sqr(c.radius);

  const delta = b * b - 4 * a * c1;

  if (delta < 0) return [];

  const t1 = (-b + Math.sqrt(delta)) / (2 * a);
  const t2 = (-b - Math.sqrt(delta)) / (2 * a);

  const p1 = new Point(l.p1.x + t1 * dx, l.p1.y + t1 * dy);
  const p2 = new Point(l.p1.x + t2 * dx, l.p1.y + t2 * dy);

  return [p1, p2];
}

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

export function cirlce(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
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

function getDeteminant(l1: Line, l2: Line) {
  return (
    (l1.p2.x - l1.p1.x) * (l2.p2.y - l2.p1.y) -
    (l2.p2.x - l2.p1.x) * (l1.p2.y - l1.p1.y)
  );
}

export function linesIntersect(l1: Line, l2: Line) {
  function orientation(p: Point, q: Point, r: Point) {
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  }

  function onSegment(p: Point, q: Point, r: Point) {
    return (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    );
  }

  let p1 = l1.p1,
    q1 = l1.p2;
  let p2 = l2.p1,
    q2 = l2.p2;

  let o1 = orientation(p1, q1, p2);
  let o2 = orientation(p1, q1, q2);
  let o3 = orientation(p2, q2, p1);
  let o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

export function getLinesIntersectionPoint(l1: Line, l2: Line) {
  if (!linesIntersect(l1, l2)) return null;

  const l1x1 = l1.p1.x;
  const l1y1 = l1.p1.y;
  const l1x2 = l1.p2.x;
  const l1y2 = l1.p2.y;
  const l2x1 = l2.p1.x;
  const l2y1 = l2.p1.y;
  const l2x2 = l2.p2.x;
  const l2y2 = l2.p2.y;

  const det = getDeteminant(l1, l2);

  const ua =
    ((l2x2 - l2x1) * (l1y1 - l2y1) - (l2y2 - l2y1) * (l1x1 - l2x1)) / det;
  return {
    x: l1x1 + ua * (l1x2 - l1x1),
    y: l1y1 + ua * (l1y2 - l1y1),
  } as Point;
}

function sqr(x: number) {
  return x * x;
}

function dist2(l: Line) {
  return sqr(l.p1.x - l.p2.x) + sqr(l.p1.y - l.p2.y);
}

export function dist(l: Line) {
  return Math.sqrt(dist2(l));
}

export function lineChangeLength(l: Line, length: number) {
  const div = Math.sqrt(sqr(l.p2.x - l.p1.x) + sqr(l.p2.y - l.p1.y));
  const dx = (l.p2.x - l.p1.x) / div;
  const dy = (l.p2.y - l.p1.y) / div;

  l.p2.x = l.p1.x + dx * length;
  l.p2.y = l.p1.y + dy * length;
}

function pdtl2(p: Point, l: Line) {
  let l2 = dist2(l);
  if (l2 === 0) return dist2(new Line(l.p1, p));

  let t =
    ((p.x - l.p1.x) * (l.p2.x - l.p1.x) + (p.y - l.p1.y) * (l.p2.y - l.p1.y)) /
    l2;
  t = Math.max(0, Math.min(1, t));

  return dist2(
    new Line(
      p,
      new Point(l.p1.x + t * (l.p2.x - l.p1.x), l.p1.y + t * (l.p2.y - l.p1.y))
    )
  );
}

export function lineChangeLengthFromCenter(l: Line, length: number) {
  const center = l.center();
  const div = Math.sqrt(sqr(l.p2.x - l.p1.x) + sqr(l.p2.y - l.p1.y));
  const dx = (l.p2.x - l.p1.x) / div;
  const dy = (l.p2.y - l.p1.y) / div;

  l.p1.x = center.x - (dx * length) / 2;
  l.p1.y = center.y - (dy * length) / 2;
  l.p2.x = center.x + (dx * length) / 2;
  l.p2.y = center.y + (dy * length) / 2;
}

export function pointDistanceToLine(p: Point, l: Line) {
  return Math.sqrt(pdtl2(p, l));
}

export function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
