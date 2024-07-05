import * as fs from "fs";
import * as path from "path";
import assert from "assert";

import { Parser } from "../../dsl-parser";
import type { AST } from "../../dsl-parser";

import { Interpreter } from "../src/index";

describe("test case", () => {
  describe("case 1", () => {
    const filePath = path.resolve("./test/demo.dsl");
    const code = fs.readFileSync(filePath, "utf-8");

    it("result 1", async () => {
      const parser = new Parser(code);
      const ast: AST = parser.parse();

      debugger;
      const interpreter = new Interpreter(ast);
      const generator = interpreter.eval();

      while (true) {
        const { done, value } = generator.next();
        if (done) {
          assert(value === 3);
          break;
        }
      }

      debugger;
    });
  });

  describe("case 2", () => {
    const filePath = path.resolve("./test/demo2.dsl");
    const code = fs.readFileSync(filePath, "utf-8");

    it("result 1", async () => {
      const parser = new Parser(code);
      const ast: AST = parser.parse();

      debugger;
      const interpreter = new Interpreter(ast);
      const generator = interpreter.eval();

      while (true) {
        const { done, value } = generator.next();
        if (done) {
          assert(value === 5);
          break;
        }
      }

      debugger;
    });
  });
});
