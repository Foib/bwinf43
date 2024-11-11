import { promises } from "fs";
import { join } from "path";
import { createCanvas } from "@napi-rs/canvas";
import {
  cirlce,
  cirlceFill,
  Line,
  readFileLines,
  getLinesIntersectionPoint,
  lineChangeLength,
  linesIntersect,
  Point,
  pointDistanceToLine,
  getCircleLineIntersectionPoints,
  getCircleCircleIntersectionPoints,
  Circle,
  hslToHex,
  lineChangeLengthFromCenter,
} from "../utils";

type DrawOptions = {
  scale: number;
};

export class Krocket {
  private _start: Point = new Point(0, 0);
  private _goals: Line[] = [];
  private _radius: number = 0;
  private _parseComplete: Promise<void>;
  private _testLines: Line[] = [];
  private _solveLine: Line | null = null;
  private _solutionExists: boolean = false;
  private _maxX: number = 0;
  private _maxY: number = 0;
  private _longestLength: number = 0;

  constructor(filePath: string) {
    this._parseComplete = new Promise((resolve) => {
      this._parseFile(filePath, resolve);
    });
  }

  public get solutionExists(): boolean {
    return this._solutionExists;
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

        if (firstLine) {
          const [_, radius] = line.split(" ").map(Number);
          this._radius = radius;
          firstLine = false;
        } else {
          const [x1, y1, x2, y2] = line.split(" ").map(Number);
          this._goals.push(
            new Line(new Point(x1, y1), new Point(x2, y2), "Goal")
          );
        }
      },
      () => {
        this._maxX = Math.max(
          this._start.x,
          ...this._goals.map((goal) => Math.max(goal.p1.x, goal.p2.x))
        );

        this._maxY = Math.max(
          this._start.y,
          ...this._goals.map((goal) => Math.max(goal.p1.y, goal.p2.y))
        );

        this._longestLength =
          Math.sqrt(Math.pow(this._maxX, 2) + Math.pow(this._maxY, 2)) * 2;

        this.solve();
        resolve();
      }
    );
  }

  private solve() {
    // Algorithm:
    // 1. Select the first goal (line segment)
    // 2. Get a line segment from center of selected goal to the outer most point of the goal where the ball can pass through
    //    The outer most point is calculated by passing a line through one end of the goal,
    //    then drawing a circle with diameter of the distance between start and end of the goal on the mid point of that distance,
    //    then drawing a circle with radius of the ball on the end of the goal,
    //    the intersection point of these two circles is the outer most point
    // 3. Extend the line segment to the longest possible length in both directions but stay within the bounds of the canvas
    // 4. Check all goals for intersection with the checking line and check if the ball can pass through the goal
    //    If all goals intersect and the ball can pass through the goal ->
    //      5. Intersecting line exists
    //    If not all goals intersect or the ball can not pass through the goal ->
    //      6. Stop at first goal that does not intersect and select it
    //      7. Get a line segment from starting point through the end of the selected goal which is nearest to previous check line
    //      8. Repeat from step 4. until starting goal is reached -> No intersecting line exists

    let startGoalIndex = 0;
    let goalIndex = startGoalIndex;
    let first = true;
    let checkLine: Line | null = null;

    // 1.
    const selectedGoal = this._goals[goalIndex];
    const nextGoal = this._goals[(goalIndex + 1) % this._goals.length];

    // 2.
    let goalPost = nextGoal.p1;

    let lineFromGoalCenterToPost = new Line(selectedGoal.center(), goalPost);

    let checkCircle = new Circle(
      lineFromGoalCenterToPost.center(),
      lineFromGoalCenterToPost.length() / 2
    );
    let ballCollisionCircle = new Circle(goalPost, this._radius);

    let circleIntersections = getCircleCircleIntersectionPoints(
      checkCircle,
      ballCollisionCircle
    );
    if (circleIntersections.length === 0) {
      throw new Error("No intersection found");
    }

    let nextGoalOuterMostPoint =
      new Line(circleIntersections[0], nextGoal.center()).length() <
      new Line(circleIntersections[1], nextGoal.center()).length()
        ? circleIntersections[0]
        : circleIntersections[1];

    // 3.
    checkLine = new Line(selectedGoal.center(), nextGoalOuterMostPoint);

    this._testLines.push(checkLine);

    while (true) {
      // 4.
      this._solutionExists = true;
      for (
        let i = (goalIndex + 1) % this._goals.length;
        i < this._goals.length;
        i++
      ) {
        const goal = this._goals[i];
        const intersectionPoint = getLinesIntersectionPoint(checkLine, goal);

        if (
          !intersectionPoint ||
          new Line(intersectionPoint, goal.p1).length() >= this._radius ||
          new Line(intersectionPoint, goal.p2).length() >= this._radius
        ) {
          this._solutionExists = false;

          let goalPost = goal.p2;
          if (
            pointDistanceToLine(goal.p1, checkLine) <=
            pointDistanceToLine(goal.p2, checkLine)
          ) {
            goalPost = goal.p1;
          }

          lineFromGoalCenterToPost = new Line(selectedGoal.center(), goalPost);

          checkCircle = new Circle(
            lineFromGoalCenterToPost.center(),
            lineFromGoalCenterToPost.length() / 2
          );
          ballCollisionCircle = new Circle(goalPost, this._radius);

          circleIntersections = getCircleCircleIntersectionPoints(
            checkCircle,
            ballCollisionCircle
          );
          if (circleIntersections.length === 0) {
            throw new Error("No intersection found");
          }

          nextGoalOuterMostPoint =
            new Line(circleIntersections[0], goal.center()).length() <
            new Line(circleIntersections[1], goal.center()).length()
              ? circleIntersections[0]
              : circleIntersections[1];

          checkLine = new Line(selectedGoal.center(), nextGoalOuterMostPoint);
          lineChangeLengthFromCenter(checkLine, this._longestLength * 2);

          this._testLines.push(checkLine);
          break;
        }
      }

      console.log("Checking goal", goalIndex);

      first = false;
      goalIndex = (goalIndex + 1) % this._goals.length;

      if ((goalIndex === startGoalIndex && !first) || this._solutionExists) {
        break;
      }
    }

    if (this._solutionExists) {
      this._solveLine = checkLine;
      console.log("Solution exists");
    } else {
      console.log("No solution exists");
    }
  }

  public async draw(
    drawSolve: boolean,
    filePath: string,
    options: DrawOptions = { scale: 1 }
  ) {
    const padding = 10;

    const canvas = createCanvas(
      (this._maxX + padding) * options.scale,
      (this._maxY + padding) * options.scale
    );
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this._goals.forEach((goal) => {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        (goal.p1.x + padding / 2) * options.scale,
        (goal.p1.y + padding / 2) * options.scale
      );
      ctx.lineTo(
        (goal.p2.x + padding / 2) * options.scale,
        (goal.p2.y + padding / 2) * options.scale
      );
      ctx.stroke();

      ctx.lineWidth = 1;
      cirlce(
        ctx,
        (goal.p1.x + padding / 2) * options.scale,
        (goal.p1.y + padding / 2) * options.scale,
        (this._radius / 2) * options.scale,
        "#ff0000"
      );
      cirlce(
        ctx,
        (goal.p2.x + padding / 2) * options.scale,
        (goal.p2.y + padding / 2) * options.scale,
        (this._radius / 2) * options.scale,
        "#ff0000"
      );
    });

    if (drawSolve) {
      if (this._testLines.length > 0) {
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 1;

        let i = 0;
        this._testLines.forEach((line) => {
          ctx.strokeStyle = hslToHex(
            (i / this._testLines.length) * 270,
            100,
            50
          );

          ctx.beginPath();
          ctx.moveTo(
            (line.p1.x + padding / 2) * options.scale,
            (line.p1.y + padding / 2) * options.scale
          );
          ctx.lineTo(
            (line.p2.x + padding / 2) * options.scale,
            (line.p2.y + padding / 2) * options.scale
          );
          ctx.stroke();

          i++;
        });
      }

      if (this._solveLine) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          (this._solveLine.p1.x + padding / 2) * options.scale,
          (this._solveLine.p1.y + padding / 2) * options.scale
        );
        ctx.lineTo(
          (this._solveLine.p2.x + padding / 2) * options.scale,
          (this._solveLine.p2.y + padding / 2) * options.scale
        );
        ctx.stroke();

        this._goals.forEach((g) => {
          const intersectionPoint = getLinesIntersectionPoint(
            this._solveLine!,
            g
          );

          if (intersectionPoint) {
            cirlceFill(
              ctx,
              (intersectionPoint.x + padding / 2) * options.scale,
              (intersectionPoint.y + padding / 2) * options.scale,
              2,
              "#ff00ff"
            );
          }
        });
      }
    }

    const png = await canvas.encode("png");

    await promises.writeFile(join(__dirname, filePath), png);
  }

  get parseComplete() {
    return this._parseComplete;
  }
}
