import * as fs from "fs";
import * as path from "path";

import { Parser } from "../../dsl-parser/src/index";
import type { AST } from "../../dsl-parser/src/index";

import { Interpreter, InterpreterEvent } from "../src/index";
import { EventNameEnum } from "../src/index";
import { EventEmitter } from "events";

class Runtime extends EventEmitter {
  private generator: Generator;
  private currentState: InterpreterEvent;

  constructor(private interpreter: Interpreter) {
    super();
    this.generator = interpreter.eval();
  }

  private updateState(event: InterpreterEvent) {
    this.currentState = event;
  }

  start() {
    const { value, done } = this.generator.next();
    this.updateState(value);
  }
  nextStep() {
    while (true) {
      const { value, done } = this.generator.next();
      if (value.eventName === EventNameEnum.EvalStatement) {
        debugger;
        this.updateState(value);
        break;
      }
    }
  }
}

const delay = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null)
    }, time * 1000);
  });
}

describe("test case", () => {
  const filePath = path.resolve("./test/demo.dsl");
  const code = fs.readFileSync(filePath, "utf-8");

  describe("case 1", () => {
    it("result 1", async () => {
      const parser = new Parser(code);
      const ast: AST = parser.parse();

      debugger;
      const interpreter = new Interpreter(ast);
      const runtime = new Runtime(interpreter);

      debugger;
      runtime.start();
      debugger;

      await delay(1);  // 模拟点击下一步
      debugger;
      runtime.nextStep();
      debugger;

      await delay(1);  // 模拟点击下一步
      debugger;
      runtime.nextStep();
      debugger;

      await delay(1);  // 模拟点击下一步
      debugger;
      runtime.nextStep();
      debugger;

      await delay(1);  // 模拟点击下一步
      debugger;
      runtime.nextStep();
      debugger;

      await delay(1);  // 模拟点击下一步
      debugger;
      runtime.nextStep();
      debugger;
    });
  });
});
