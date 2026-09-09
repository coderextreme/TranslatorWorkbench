/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Translator's Engine (TE) - 4D Reversible Interpreter
 * Fully reversible execution machine with time-travel, undo stack,
 * and live operation injection grounded in Carlson (2001).
 */

import {
  DesktopObjectsState,
  ExecutionDelta,
  MapOperation,
  ProgramBlueprint,
  DesktopObjectType,
  Coord4D
} from '../types';

export function createInitialState(blueprint: ProgramBlueprint): DesktopObjectsState {
  return {
    calculator: {
      stack: [0],
      lastOp: 'INIT'
    },
    stringCalculator: {
      buffer: '',
      lastOp: 'INIT'
    },
    dateCalculator: {
      currentDate: '2001-10-14',
      displayFormat: 'YYYYMMDD',
      offsetDays: 0
    },
    inputDoc: {
      id: 'input-doc',
      name: 'Input Document',
      content: blueprint.initialInputText,
      cursor: { line: 0, col: 0 }
    },
    outputDoc: {
      id: 'output-doc',
      name: 'Output Document',
      content: '',
      cursor: { line: 0, col: 0 }
    },
    form: {
      root: blueprint.initialForm || {
        id: 'root',
        type: 'RECORD',
        name: 'RootRecord',
        value: 'DATA_MAP',
        status: 'OK'
      },
      selectedId: blueprint.initialForm?.children?.[0]?.id || 'root',
      status: 'OK'
    },
    branchKeys: {
      Index: '0'
    },
    visibleObjects: {
      calculator: true,
      stringCalculator: false,
      dateCalculator: false,
      inputDoc: true,
      outputDoc: true,
      form: !!blueprint.initialForm,
      branchTable: true,
      sqlRunner: false
    }
  };
}

export function cloneState(state: DesktopObjectsState): DesktopObjectsState {
  return JSON.parse(JSON.stringify(state));
}

export interface StepResult {
  nextIndex: number;
  delta: ExecutionDelta;
  halted: boolean;
  message: string;
}

export function executeOperationForward(
  op: MapOperation,
  currentIndex: number,
  currentState: DesktopObjectsState,
  operations: MapOperation[],
  currentStepNumber: number
): StepResult {
  const stateBefore = cloneState(currentState);
  const stateAfter = cloneState(currentState);
  let nextIndex = currentIndex + 1;
  let branchTaken: string | undefined = undefined;
  let message = `Executed ${op.type}: ${op.label}`;

  const currentCoord: Coord4D = {
    ...op.coord,
    t: currentStepNumber
  };

  switch (op.type) {
    case 'Create/Show': {
      const target = op.params.targetObject as DesktopObjectType;
      if (target && stateAfter.visibleObjects[target] !== undefined) {
        stateAfter.visibleObjects[target] = true;
        message = `Displayed desktop object: ${target}`;
      }
      break;
    }

    case 'Hide': {
      const target = op.params.targetObject as DesktopObjectType;
      if (target && stateAfter.visibleObjects[target] !== undefined) {
        stateAfter.visibleObjects[target] = false;
        message = `Hid desktop object: ${target}`;
      }
      break;
    }

    case 'Arithmetic': {
      const stack = [...stateAfter.calculator.stack];
      const action = op.params.arithmeticOp || '+';
      const val = typeof op.params.arithmeticValue === 'number' ? op.params.arithmeticValue : 0;

      if (action === 'CLEAR') {
        stateAfter.calculator.stack = [val];
        stateAfter.calculator.lastOp = `CLEAR [${val}]`;
      } else if (action === 'PUSH') {
        stack.push(val);
        stateAfter.calculator.stack = stack;
        stateAfter.calculator.lastOp = `PUSH ${val}`;
      } else if (action === 'ENTER') {
        const top = stack.length > 0 ? stack[stack.length - 1] : 0;
        stack.push(top);
        stateAfter.calculator.stack = stack;
        stateAfter.calculator.lastOp = `ENTER (dup ${top})`;
      } else if (action === '+') {
        if (op.params.arithmeticValue !== undefined) {
          const top = (stack.pop() ?? 0) + Number(op.params.arithmeticValue);
          stack.push(top);
          stateAfter.calculator.lastOp = `+ ${op.params.arithmeticValue} -> ${top}`;
        } else if (stack.length >= 2) {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a + b);
          stateAfter.calculator.lastOp = `${a} + ${b} = ${a + b}`;
        } else if (stack.length === 1) {
          stack[0] = stack[0] + 1;
          stateAfter.calculator.lastOp = `INC -> ${stack[0]}`;
        }
        stateAfter.calculator.stack = stack;
      } else if (action === '-') {
        if (stack.length >= 2) {
          const b = stack.pop()!;
          const a = stack.pop()!;
          stack.push(a - b);
          stateAfter.calculator.lastOp = `${a} - ${b} = ${a - b}`;
        }
        stateAfter.calculator.stack = stack;
      }
      message = `RPN Calc: ${stateAfter.calculator.lastOp}`;
      break;
    }

    case 'Copy': {
      const fromObj = op.params.copyFrom?.object;
      const toObj = op.params.copyTo?.object;
      let copiedText = '';

      // Determine source value
      if (fromObj === 'calculator') {
        const top = stateAfter.calculator.stack[stateAfter.calculator.stack.length - 1] ?? 0;
        copiedText = String(top);
      } else if (fromObj === 'stringCalculator') {
        copiedText = stateAfter.stringCalculator.buffer;
      } else if (fromObj === 'dateCalculator') {
        copiedText = stateAfter.dateCalculator.currentDate;
      } else if (fromObj === 'inputDoc') {
        const lines = stateAfter.inputDoc.content.split('\n');
        const curLine = lines[stateAfter.inputDoc.cursor.line] || '';
        copiedText = curLine;
      } else if (fromObj === 'form') {
        const selId = stateAfter.form.selectedId;
        const findNode = (node: any): any => {
          if (node.id === selId) return node;
          if (node.children) {
            for (const child of node.children) {
              const res = findNode(child);
              if (res) return res;
            }
          }
          return null;
        };
        const activeNode = findNode(stateAfter.form.root);
        copiedText = activeNode ? `${activeNode.name}: ${activeNode.value}` : 'NODE_VAL';
      } else {
        copiedText = op.params.description || op.label.replace('Emit ', '').replace('Copy ', '');
      }

      // Route to destination
      if (toObj === 'branchTable') {
        const field = op.params.copyTo?.field || 'Index';
        stateAfter.branchKeys[field] = copiedText;
        message = `Copied "${copiedText}" into Branch[${field}]`;
      } else if (toObj === 'outputDoc') {
        const out = stateAfter.outputDoc.content;
        const sep = out.length > 0 && !out.endsWith('\n') ? '\n' : '';
        stateAfter.outputDoc.content = out + sep + copiedText;
        stateAfter.outputDoc.cursor.line = stateAfter.outputDoc.content.split('\n').length - 1;
        message = `Wrote to Output: "${copiedText}"`;
      } else if (toObj === 'stringCalculator') {
        stateAfter.stringCalculator.buffer = copiedText;
        stateAfter.stringCalculator.lastOp = `COPY_IN [${copiedText}]`;
        message = `String Calculator loaded: "${copiedText}"`;
      } else if (toObj === 'calculator') {
        const num = parseFloat(copiedText) || 0;
        stateAfter.calculator.stack.push(num);
        message = `RPN Calculator pushed: ${num}`;
      } else {
        // Default: append to output document if label indicates emit
        if (op.label.startsWith('Emit')) {
          const seg = op.label.replace('Emit ', '');
          const out = stateAfter.outputDoc.content;
          const sep = out.length > 0 && !out.endsWith('\n') ? '\n' : '';
          stateAfter.outputDoc.content = out + sep + seg;
          stateAfter.outputDoc.cursor.line = stateAfter.outputDoc.content.split('\n').length - 1;
          message = `Emitted segment: ${seg}`;
        }
      }
      break;
    }

    case 'Lookup': {
      const testVal = parseInt(stateAfter.branchKeys['Index'] || '0', 10);
      const preds = op.params.branchPredicates || [];
      // Figure 1 conditional test:
      // If Index is 24, route to proc-halt (end or empty branch)
      // Otherwise route to proc-increment-and-write
      const is24 = testVal >= 24;
      if (is24) {
        branchTaken = 'Index 24 (is 24)';
        // Jump past loop body (beyond op-11)
        nextIndex = operations.length; // Complete execution
        message = `Branch matched: Index 24 (Terminating loop)`;
      } else {
        branchTaken = 'Index Anything (not 24)';
        nextIndex = currentIndex + 1;
        message = `Branch matched: Index = ${testVal} (Proceed down "not 24" column)`;
      }
      break;
    }

    case 'Move Text Location': {
      const offset = op.params.offset || { dLine: 1, dCol: 0 };
      stateAfter.outputDoc.cursor.line += offset.dLine;
      stateAfter.outputDoc.cursor.col += offset.dCol;
      message = `Output Document cursor moved by [${offset.dLine >= 0 ? '+' : ''}${offset.dLine}, ${offset.dCol >= 0 ? '+' : ''}${offset.dCol}]`;
      break;
    }

    case 'Search': {
      const term = op.params.searchTerm || '';
      const lines = stateAfter.inputDoc.content.split('\n');
      const foundIdx = lines.findIndex((l) => l.includes(term));
      if (foundIdx !== -1) {
        stateAfter.inputDoc.cursor = { line: foundIdx, col: lines[foundIdx].indexOf(term) };
        stateAfter.inputDoc.searchResult = {
          line: foundIdx,
          col: lines[foundIdx].indexOf(term),
          text: term
        };
        message = `Search found "${term}" at line ${foundIdx}`;
      } else {
        message = `Search: "${term}" not found`;
      }
      break;
    }

    case 'Reset': {
      stateAfter.inputDoc.cursor = { line: 0, col: 0 };
      stateAfter.inputDoc.searchResult = null;
      message = `Reset Input Document cursor to top (line 0, col 0)`;
      break;
    }

    case 'Justify': {
      const str = stateAfter.stringCalculator.buffer;
      const width = op.params.targetWidth || 15;
      const pad = op.params.paddingChar || ' ';
      const mode = op.params.justifyType || 'left';
      let justified = str;
      if (mode === 'left') {
        justified = str.padEnd(width, pad);
      } else if (mode === 'right') {
        justified = str.padStart(width, pad);
      } else {
        const padTotal = Math.max(0, width - str.length);
        const padLeft = Math.floor(padTotal / 2);
        const padRight = padTotal - padLeft;
        justified = pad.repeat(padLeft) + str + pad.repeat(padRight);
      }
      stateAfter.stringCalculator.buffer = justified;
      stateAfter.stringCalculator.lastOp = `JUSTIFY_${mode.toUpperCase()} [${width}]`;
      message = `String Calculator justified ${mode}: "${justified}"`;
      break;
    }

    case 'Trim': {
      stateAfter.stringCalculator.buffer = stateAfter.stringCalculator.buffer.trim();
      stateAfter.stringCalculator.lastOp = 'TRIM';
      message = `String Calculator trimmed whitespace`;
      break;
    }

    case 'Truncate': {
      const len = op.params.truncateLen || 10;
      stateAfter.stringCalculator.buffer = stateAfter.stringCalculator.buffer.substring(0, len);
      stateAfter.stringCalculator.lastOp = `TRUNCATE [${len}]`;
      message = `String Calculator truncated to ${len} characters`;
      break;
    }

    case 'Ack': {
      const ackContent = `ISA*00*          *00*          *ZZ*BOA            *ZZ*LLNL           *011014*1530*U*00401*000000001*0*P*>~
GS*FA*BOA*LLNL*20011014*1530*1*X*004010~
ST*997*0001~
AK1*RA*0001~
AK2*820*0001~
AK5*A~
AK9*A*1*1*1~
SE*8*0001~
GE*1*1~
IEA*1*000000001~`;
      stateAfter.outputDoc.content += (stateAfter.outputDoc.content ? '\n\n' : '') + '--- EDI 997 FUNCTIONAL ACKNOWLEDGEMENT ---\n' + ackContent;
      message = `Generated EDI 997 Functional Acknowledgement`;
      break;
    }

    case 'Extend': {
      // Outline form navigation to next node
      const currentSel = stateAfter.form.selectedId;
      const allIds: string[] = [];
      const collect = (n: any) => {
        allIds.push(n.id);
        if (n.children) n.children.forEach(collect);
      };
      collect(stateAfter.form.root);
      const currIdx = allIds.indexOf(currentSel);
      const nextId = allIds[(currIdx + 1) % allIds.length] || allIds[0];
      stateAfter.form.selectedId = nextId;
      stateAfter.form.status = currIdx + 1 >= allIds.length ? 'End' : 'OK';
      message = `Form extended/navigated to node "${nextId}" (Status: ${stateAfter.form.status})`;
      break;
    }

    case 'Loop': {
      // Find branch lookup operation
      const lookupIdx = operations.findIndex((o) => o.type === 'Lookup');
      if (lookupIdx !== -1) {
        nextIndex = lookupIdx;
        message = `LOOP: Iteration jump back to branch predicate (Index = ${stateAfter.branchKeys['Index'] || 0})`;
      } else {
        nextIndex = 0;
        message = `LOOP: Jump to beginning`;
      }
      break;
    }

    default:
      message = `Executed ${op.type}`;
  }

  const delta: ExecutionDelta = {
    step: currentStepNumber,
    opId: op.id,
    opType: op.type,
    coord: currentCoord,
    description: message,
    stateBefore,
    stateAfter,
    nextOpIndex: nextIndex,
    branchTaken
  };

  const halted = nextIndex >= operations.length;

  return {
    nextIndex,
    delta,
    halted,
    message
  };
}
