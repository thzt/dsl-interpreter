import type {
  AST, SourceFile,
  Statement,
  VariableDeclaration, FunctionDeclaration,
  FunctionBody,
  PlusExpression,
} from '../../dsl-parser/src/index';
import { Token } from '../../dsl-parser/src/token';

type Frame = Map<string, any>;
type Env = Frame[];

interface FunctionEntity {
  lexicalEnv: Env;
  functionDeclaration: FunctionDeclaration;
}

export class Interpreter {
  constructor(private ast: AST) { }

  public eval() {
    // 初始化 global 环境
    const env: Env = [];
    const frame = new Map<string, any>();
    env.push(frame);

    // 开始求值
    const { SourceFile } = this.ast;
    return this.evalSourceFile(env, SourceFile);
  }

  private evalSourceFile(env: Env, sourceFile: SourceFile) {
    const { StatementList } = sourceFile;
    const statementValues = this.evalStatementList(env, StatementList);

    // 只返回最后一个值
    return statementValues[statementValues.length - 1];
  }

  private evalStatementList(env: Env, statementList: Statement[]) {
    const statementValues = [];
    for (let i = 0; i < statementList.length; i++) {
      const statement = statementList[i];
      const statementValue = this.evalStatement(env, statement);
      statementValues.push(statementValue);
    }

    return statementValues;
  }

  private evalStatement(env: Env, statement: Statement) {
    const isVariableDeclaration = (statement as VariableDeclaration).VariableDeclaration != null;
    if (isVariableDeclaration) {
      return this.evalVariableDeclaration(env, statement as VariableDeclaration);
    }
    return this.evalFunctionDeclaration(env, statement as FunctionDeclaration);
  }

  private evalVariableDeclaration(env: Env, statement: VariableDeclaration) {
    const {
      VariableDeclaration: {
        name: variableDeclarationName,
        value: variableDeclarationValue,
      },
    } = statement;

    // value 可以是 token（单纯赋值） 也可以是 CallExpression
    const isToken = (variableDeclarationValue instanceof Token);

    // 1. 单纯赋值
    if (isToken) {
      const variableName = variableDeclarationName.source;
      const variableValue = +variableDeclarationValue.source;  // 当前只支持 数字

      this.addBindingToLastestFrame(env, variableName, variableValue);
      return variableValue;
    }

    // 2. 函数调用再赋值 CallExpression
    const {
      CallExpression: {
        name: functionCallName,
        argument: functionCallArgument,
      },
    } = variableDeclarationValue;
    const functionName = functionCallName.source;
    const { isFound, value: functionEntity } = this.findValueFromEnv(env, functionName);
    if (!isFound) {
      throw new Error(`没找到函数：${functionName}`);
    }

    // 在词法环境中求值
    const {
      lexicalEnv,
      functionDeclaration: {
        FunctionDeclaration: {
          parameter: functionDeclarationParameter,
          body: functionDeclarationBody,
        }
      }
    } = functionEntity as FunctionEntity;

    // 将 形参到实参的绑定，创建一个新 frame 加入词法环境中
    const parameterName = functionDeclarationParameter.source;
    const argumentName = functionCallArgument.source;

    // TODO: 这里只支持传入变量（以后要支持传入一个表达式）
    // 这个表达式要在当前环境中递归求值再绑定
    const {
      isFound: isFoundArgumentValue,
      value: argumentValue
    } = this.findValueFromEnv(env, argumentName); // 先求值再绑定
    if (!isFoundArgumentValue) {
      throw new Error(`没找到实参的值`);
    }
    this.addNewFrameToEnv(lexicalEnv, parameterName, argumentValue);

    // 在扩充后的词法环境中，求值函数体
    const functionReturnValue = this.evalFunctionBody(lexicalEnv, functionDeclarationBody);
    // 退出后把帧删掉，把词法环境复原
    this.removeLastestFrameFromEnv(lexicalEnv);

    // CallExpression 求值完，别忘了绑定到环境
    const variableName = variableDeclarationName.source;
    this.addBindingToLastestFrame(env, variableName, functionReturnValue);
    return functionReturnValue;
  }

  private evalFunctionBody(env: Env, functionBody: FunctionBody) {
    const {
      StatementList,
      ReturnStatement,
    } = functionBody;

    // 只返回 return 的值，statementValues 会被丢弃
    const statementValues = this.evalStatementList(env, StatementList);

    // 求值 ReturnStatement，是一个 Token 或者 加法表达式
    const isToken = ReturnStatement instanceof Token;
    if (isToken) {
      const key = ReturnStatement.source;
      const {
        isFound,
        value,
      } = this.findValueFromEnv(env, key);
      if (!isFound) {
        throw new Error(`未找到返回值`);
      }
      return value;
    }

    // 计算加法
    const {
      PlusExpression: {
        left,
        right,
      }
    } = ReturnStatement as PlusExpression;

    // TODO: 这里应该递归求值一下表达式
    const leftName = left.source;
    const {
      isFound: isFoundLeft,
      value: leftValue
    } = this.findValueFromEnv(env, leftName);
    const rightName = right.source;
    const {
      isFound: isFoundRight,
      value: rightValue,
    } = this.findValueFromEnv(env, rightName);
    if (!isFoundLeft || !isFoundLeft) {  // 有一个没找到就报错
      throw new Error(`没找到加法表达式的值`);
    }
    return (+leftValue) + (+rightValue);
  }

  private addNewFrameToEnv(env: Env, key: string, value: any) {
    const frame = new Map<string, any>();
    frame.set(key, value);
    env.push(frame);
  }

  private addBindingToLastestFrame(env: Env, key: string, value: any) {
    const lastestFrame = env[env.length - 1];
    lastestFrame.set(key, value);
  }

  // 浅复制
  private createSnapshotEnv(env: Env): Env {
    const snapshotEnv: Env = [];
    for (let i = 0; i < env.length; i++) {
      const frame = env[i];
      snapshotEnv.push(frame);
    }
    return snapshotEnv;
  }

  private removeLastestFrameFromEnv(env) {
    env.pop();
  }

  private findValueFromEnv(env: Env, key: string): { isFound: boolean, value?: any } {
    // 从最后一个帧开始往前找
    for (let i = env.length - 1; i >= 0; i--) {
      const frame = env[i];
      if (frame.has(key)) {
        return {
          isFound: true,
          value: frame.get(key),
        };
      }
    }
    return {
      isFound: false,
    }
  }

  private evalFunctionDeclaration(env: Env, statement: FunctionDeclaration) {
    const {
      FunctionDeclaration: {
        name,
      },
    } = statement;

    const functionName = name.source;
    const functionEntity: FunctionEntity = {
      lexicalEnv: null,
      functionDeclaration: statement,
    };

    this.addBindingToLastestFrame(env, functionName, functionEntity);

    // 把当前环境的快照 作为词法环境，避免被外层改变
    const snapshotEnv = this.createSnapshotEnv(env);
    functionEntity.lexicalEnv = snapshotEnv; // 为了让函数的词法环境中包含自己

    return functionEntity;
  }
}
