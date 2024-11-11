import { Krocket } from "./aufgabe4";

if (process.argv.length < 3) {
  console.error("No base file name provided");
  process.exit(1);
}

let scale = 1;
if (process.argv.length > 3) {
  scale = parseFloat(process.argv[3]);
}

const fileBaseKrocket = Bun.argv[2];
const krocket = new Krocket(fileBaseKrocket + ".txt");
krocket.parseComplete.then(() => {
  krocket.draw(true, fileBaseKrocket + ".png", {
    scale,
  });
});
