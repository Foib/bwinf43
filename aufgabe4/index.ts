import { promises } from "fs";
import { join } from "path";
import { createCanvas } from "@napi-rs/canvas";
import { cirlceFill, readFileLines } from "../utils";

type Position = { x: number; y: number };
type Goal = { p1: Position; p2: Position };

export class Krocket {
  private _start: Position = { x: 0, y: 0 };
  private _goals: Goal[] = [];
  private _parseComplete: Promise<void>;
  private _solveLine: { p1: Position; p2: Position } | null = null;

  constructor(filePath: string) {
    this._parseComplete = new Promise((resolve) => {
      this._parseFile(filePath, resolve);
    });
  }

  private _parseFile(
    filePath: string,
    resolve: (value: void | PromiseLike<void>) => void
  ) {
    let firstLine = true;

    readFileLines(
      join(__dirname, filePath),
      (line) => {
        if (!line) return;

        const [x, y] = line.split(" ").map(Number);

        if (firstLine) {
          this._start = { x, y };
          firstLine = false;
        } else {
          const [x1, y1, x2, y2] = line.split(" ").map(Number);
          this._goals.push({ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } });
        }
      },
      () => {
        console.log(this._goals);
        this.solve();
        resolve();
      }
    );
  }

  private solve() {
    const farthestGoal = this.getFarthestGoal();

    if (!farthestGoal) return;

    const goalMidpoint: Position = {
      x: (farthestGoal.p1.x + farthestGoal.p2.x) / 2,
      y: (farthestGoal.p1.y + farthestGoal.p2.y) / 2,
    };

    this._solveLine = { p1: this._start, p2: goalMidpoint };
  }

  private getFarthestGoal() {
    let farthestGoal: Goal | null = null;
    let farthestDistance = 0;

    for (let i = 0; i < this._goals.length; i++) {
      const goal = this._goals[i];
      const goalMidpoint: Position = {
        x: (goal.p1.x + goal.p2.x) / 2,
        y: (goal.p1.y + goal.p2.y) / 2,
      };
      const distance = Math.sqrt(
        Math.pow(this._start.x - goalMidpoint.x, 2) +
          Math.pow(this._start.y - goalMidpoint.y, 2)
      );

      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestGoal = goal;
      }
    }

    return farthestGoal;
  }

  public async draw(drawSolve: boolean, outPath: string) {
    const padding = 10;
    const maxX = Math.max(
      this._start.x,
      ...this._goals.map((goal) => Math.max(goal.p1.x, goal.p2.x))
    );
    const maxY = Math.max(
      this._start.y,
      ...this._goals.map((goal) => Math.max(goal.p1.y, goal.p2.y))
    );

    const canvas = createCanvas(maxX + padding, maxY + padding);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 500, 500);

    cirlceFill(
      ctx,
      this._start.x + padding / 2,
      this._start.y + padding / 2,
      3,
      "blue"
    );

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    this._goals.forEach((goal) => {
      ctx.beginPath();
      ctx.moveTo(goal.p1.x + padding / 2, goal.p1.y + padding / 2);
      ctx.lineTo(goal.p2.x + padding / 2, goal.p2.y + padding / 2);
      ctx.stroke();

      cirlceFill(
        ctx,
        goal.p1.x + padding / 2,
        goal.p1.y + padding / 2,
        2,
        "red"
      );
      cirlceFill(
        ctx,
        goal.p2.x + padding / 2,
        goal.p2.y + padding / 2,
        2,
        "red"
      );
    });

    if (drawSolve && this._solveLine) {
      ctx.strokeStyle = "green";
      ctx.beginPath();
      ctx.moveTo(
        this._solveLine.p1.x + padding / 2,
        this._solveLine.p1.y + padding / 2
      );
      ctx.lineTo(
        this._solveLine.p2.x + padding / 2,
        this._solveLine.p2.y + padding / 2
      );
      ctx.stroke();
    }

    const png = await canvas.encode("png");

    await promises.writeFile(join(__dirname, outPath), png);
  }

  get parseComplete() {
    return this._parseComplete;
  }
}
