import * as fs from "fs";
import * as path from "path";

import { Parser } from "../../dsl-parser/src/index";
import type { AST } from "../../dsl-parser/src/index";

import { Interpreter } from "../src/index";

describe("test case", () => {
  const filePath = path.resolve("./test/demo.dsl");
  const code = fs.readFileSync(filePath, "utf-8");

  describe("case 1", () => {
    it("result 1", () => {
      const parser = new Parser(code);
      const ast: AST = parser.parse();

      debugger;
      const interpreter = new Interpreter(ast);
      const value = interpreter.eval();
      debugger;
    });
  });
});
