import { Krocket } from "./aufgabe4";

const krocket1 = new Krocket("./krocket2.txt");
krocket1.parseComplete.then(() => {
  krocket1.draw(true, "./krocket2.png");
});
