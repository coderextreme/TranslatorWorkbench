/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 4D Visual Language for Data Mapping
 * Formal Types and Definitions based on J.W. Carlson (LLNL / OOPSLA 2001)
 */

export interface Coord4D {
  x: number; // Domain space / Horizontal Branch alternative (e.g. -2: Input, -1: Form, 0: Branch, 1: Calc, 2: Output)
  y: number; // Vertical instruction sequence / Tape line offset
  z: number; // Hierarchical structural depth (0: Root/Enclosing, 1: Procedure, 2: Sub-element, 3: Leaf)
  t: number; // Temporal execution step / Worldline timestamp
}

export type OperationType =
  | 'Create/Show'
  | 'Hide'
  | 'Arithmetic'
  | 'Send'
  | 'Receive'
  | 'Lookup'
  | 'Procedure'
  | 'Move Text Location'
  | 'Search'
  | 'Reset'
  | 'Justify'
  | 'Trim'
  | 'Truncate'
  | 'Copy'
  | 'Ack'
  | 'Extend'
  | 'Loop';

export type DesktopObjectType =
  | 'calculator'
  | 'stringCalculator'
  | 'dateCalculator'
  | 'inputDoc'
  | 'outputDoc'
  | 'form'
  | 'branchTable'
  | 'sqlRunner';

export interface OperationParams {
  targetObject?: string;
  sourceObject?: string;
  arithmeticOp?: 'ENTER' | '+' | '-' | '*' | '/' | 'SWAP' | 'PUSH' | 'POP' | 'CLEAR';
  arithmeticValue?: number | string;
  copyFrom?: { object: string; field?: string; line?: number; col?: number };
  copyTo?: { object: string; field?: string; line?: number; col?: number };
  offset?: { dLine: number; dCol: number };
  searchTerm?: string;
  justifyType?: 'left' | 'center' | 'right';
  paddingChar?: string;
  targetWidth?: number;
  truncateLen?: number;
  dateFormatFrom?: string;
  dateFormatTo?: string;
  branchPredicates?: Array<{
    id: string;
    label: string;
    condition: 'Equal to' | 'Is filled' | 'In set' | 'Anything' | 'not 24' | 'is 24';
    expectedValue?: string | number;
    procedureId: string;
  }>;
  label?: string;
  description?: string;
}

export interface MapOperation {
  id: string;
  type: OperationType;
  label: string;
  coord: Coord4D;
  params: OperationParams;
  subProcedureIds?: string[];
  isBreakpoint?: boolean;
}

export interface BranchProcedure {
  id: string;
  name: string;
  predicateId: string;
  predicateLabel: string;
  conditionDescription: string;
  operations: MapOperation[];
}

export interface BranchObject {
  id: string;
  name: string;
  testKey: string;
  branches: {
    predicate: string;
    condition: string;
    procedure: MapOperation[];
  }[];
}

export interface RpnCalculatorState {
  stack: number[];
  lastOp: string;
}

export interface StringCalculatorState {
  buffer: string;
  lastOp: string;
}

export interface DateCalculatorState {
  currentDate: string; // ISO or formatted
  displayFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'JULIAN' | 'MM/DD/YYYY';
  offsetDays: number;
}

export interface DocumentState {
  id: string;
  name: string;
  content: string;
  cursor: { line: number; col: number };
  searchResult?: { line: number; col: number; text: string } | null;
}

export interface FormOutlineNode {
  id: string;
  type: string; // e.g., 'SEGMENT', 'ELEMENT', 'TAG'
  name: string;
  value: string;
  status: 'OK' | 'End';
  children?: FormOutlineNode[];
}

export interface FormOutlineState {
  root: FormOutlineNode;
  selectedId: string;
  status: 'OK' | 'End';
}

export interface DesktopObjectsState {
  calculator: RpnCalculatorState;
  stringCalculator: StringCalculatorState;
  dateCalculator: DateCalculatorState;
  inputDoc: DocumentState;
  outputDoc: DocumentState;
  form: FormOutlineState;
  branchKeys: Record<string, string>;
  visibleObjects: Record<DesktopObjectType, boolean>;
}

export interface ExecutionDelta {
  step: number;
  opId: string;
  opType: OperationType;
  coord: Coord4D;
  description: string;
  stateBefore: DesktopObjectsState;
  stateAfter: DesktopObjectsState;
  nextOpIndex: number;
  branchTaken?: string;
}

export interface ProgramBlueprint {
  id: string;
  name: string;
  description: string;
  paperReference: string;
  initialInputText: string;
  initialForm?: FormOutlineNode;
  operations: MapOperation[];
}

export interface ProgrammerPresence {
  id: string;
  name: string;
  role: string;
  color: string; // Hex color code
  avatar: string; // Emoji or initials
  focusedOpId?: string | null;
  currentStep?: number;
  cursorScreen?: { x: number; y: number } | null;
  lastActive: number;
}

export interface ProgrammerChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderColor: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

export interface CollabActivityEvent {
  id: string;
  programmerName: string;
  programmerColor: string;
  action: string;
  target?: string;
  timestamp: number;
}

export type CollabMessage =
  | {
      type: 'room:init';
      payload: {
        operations: MapOperation[];
        selectedBlueprintId: string;
        breakpoints: string[];
        programmers: ProgrammerPresence[];
        executionSync: boolean;
        currentOpIndex: number;
        currentStep: number;
        chatMessages: ProgrammerChatMessage[];
        activities: CollabActivityEvent[];
      };
    }
  | { type: 'programmer:join'; payload: ProgrammerPresence }
  | { type: 'programmer:update'; payload: Partial<ProgrammerPresence> & { id: string } }
  | { type: 'programmer:leave'; payload: { id: string } }
  | {
      type: 'op:add';
      payload: {
        operation: MapOperation;
        atIndex: number;
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'op:update';
      payload: {
        operation: MapOperation;
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'op:delete';
      payload: {
        opId: string;
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'op:reorder';
      payload: {
        operations: MapOperation[];
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'breakpoint:toggle';
      payload: {
        opId: string;
        armed: boolean;
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'blueprint:select';
      payload: {
        blueprintId: string;
        operations: MapOperation[];
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'execution:step';
      payload: {
        currentOpIndex: number;
        currentStep: number;
        delta?: ExecutionDelta;
        programmer: { name: string; color: string };
      };
    }
  | {
      type: 'execution:sync_toggle';
      payload: {
        enabled: boolean;
        programmer: { name: string; color: string };
      };
    }
  | { type: 'chat:message'; payload: ProgrammerChatMessage };

