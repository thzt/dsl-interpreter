import * as fs from "fs";
import * as path from "path";

import { Parser } from "../../dsl-parser/src/index";

describe("test case", () => {
  const filePath = path.resolve("./test/demo.dsl");
  const code = fs.readFileSync(filePath, "utf-8");

  describe("case 1", () => {
    it("result 1", () => {
      debugger;
      const parser = new Parser(code);
      const ast = parser.parse();
      debugger;
    });
  });
});
