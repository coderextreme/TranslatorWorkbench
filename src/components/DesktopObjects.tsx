/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Desktop Objects Component
 * Authentic implementations of Carlson's desktop components:
 * 1. RPN Calculator (Reverse Polish Notation arithmetic & segment counter)
 * 2. String Calculator (Trim, truncate, justify, padding)
 * 3. Date Calculator (Format transforms, date arithmetic)
 * 4. Input Document (Text file, cursor navigation, search, reset)
 * 5. Output Document (Stream target, segment emitter)
 * 6. Form Outline (XML/EDI tree hierarchy, status OK/End)
 * 7. Branch Predicate Matrix (Guarded procedures)
 */

import React, { useState } from 'react';
import {
  Calculator,
  FileText,
  Calendar,
  Type,
  FolderTree,
  GitFork,
  Search,
  RotateCcw,
  Copy,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Check,
  Download
} from 'lucide-react';
import { DesktopObjectsState, DesktopObjectType } from '../types';

interface DesktopObjectsProps {
  state: DesktopObjectsState;
  onUpdateState: (updater: (prev: DesktopObjectsState) => DesktopObjectsState) => void;
}

export const DesktopObjects: React.FC<DesktopObjectsProps> = ({ state, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<DesktopObjectType>('calculator');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 1800);
  };

  // RPN Calculator Handlers
  const handleRpnNum = (digit: string) => {
    onUpdateState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const top = next.calculator.stack[next.calculator.stack.length - 1] ?? 0;
      next.calculator.stack[next.calculator.stack.length - 1] = parseFloat(`${top}${digit}`);
      next.calculator.lastOp = `NUM ${digit}`;
      return next;
    });
  };

  const handleRpnOp = (op: '+' | '-' | '*' | '/' | 'ENTER' | 'CLEAR' | 'SWAP') => {
    onUpdateState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const stack = [...next.calculator.stack];

      if (op === 'CLEAR') {
        next.calculator.stack = [0];
        next.calculator.lastOp = 'CLEAR';
      } else if (op === 'ENTER') {
        const top = stack.length > 0 ? stack[stack.length - 1] : 0;
        stack.push(top);
        next.calculator.stack = stack;
        next.calculator.lastOp = `ENTER (dup ${top})`;
      } else if (op === 'SWAP' && stack.length >= 2) {
        const a = stack.pop()!;
        const b = stack.pop()!;
        stack.push(a);
        stack.push(b);
        next.calculator.stack = stack;
        next.calculator.lastOp = 'SWAP';
      } else if (stack.length >= 2) {
        const b = stack.pop()!;
        const a = stack.pop()!;
        let res = 0;
        if (op === '+') res = a + b;
        if (op === '-') res = a - b;
        if (op === '*') res = a * b;
        if (op === '/') res = b !== 0 ? a / b : 0;
        stack.push(res);
        next.calculator.stack = stack;
        next.calculator.lastOp = `${a} ${op} ${b} = ${res}`;
      } else if (stack.length === 1 && op === '+') {
        stack[0] = stack[0] + 1;
        next.calculator.stack = stack;
        next.calculator.lastOp = `INC -> ${stack[0]}`;
      }
      return next;
    });
  };

  // String Calculator Handlers
  const handleStringTransform = (action: 'trim' | 'justifyLeft' | 'justifyRight' | 'justifyCenter' | 'upper' | 'lower') => {
    onUpdateState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let buf = next.stringCalculator.buffer;
      if (action === 'trim') buf = buf.trim();
      if (action === 'justifyLeft') buf = buf.padEnd(20, ' ');
      if (action === 'justifyRight') buf = buf.padStart(20, ' ');
      if (action === 'justifyCenter') {
        const pad = Math.max(0, 20 - buf.length);
        buf = ' '.repeat(Math.floor(pad / 2)) + buf + ' '.repeat(Math.ceil(pad / 2));
      }
      if (action === 'upper') buf = buf.toUpperCase();
      if (action === 'lower') buf = buf.toLowerCase();

      next.stringCalculator.buffer = buf;
      next.stringCalculator.lastOp = action.toUpperCase();
      return next;
    });
  };

  // Date Calculator Handlers
  const handleDateOffset = (deltaDays: number) => {
    onUpdateState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const curr = new Date(next.dateCalculator.currentDate || '2001-10-14');
      curr.setDate(curr.getDate() + deltaDays);
      next.dateCalculator.currentDate = curr.toISOString().split('T')[0];
      next.dateCalculator.offsetDays += deltaDays;
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 border-l border-neutral-800 select-none overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-2 bg-neutral-900 border-b border-neutral-800 overflow-x-auto text-xs">
        <button
          id="tab-btn-calculator"
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'calculator'
              ? 'bg-neutral-800 text-blue-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>RPN Calc</span>
          <span className="text-[10px] font-mono px-1 py-0.2 bg-blue-950 text-blue-300 rounded">
            {state.calculator.stack[state.calculator.stack.length - 1] ?? 0}
          </span>
        </button>

        <button
          id="tab-btn-output-doc"
          onClick={() => setActiveTab('outputDoc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'outputDoc'
              ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Output Doc</span>
          <span className="text-[10px] font-mono px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded">
            {state.outputDoc.content.split('\n').filter(Boolean).length}L
          </span>
        </button>

        <button
          id="tab-btn-input-doc"
          onClick={() => setActiveTab('inputDoc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'inputDoc'
              ? 'bg-neutral-800 text-sky-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Input Doc</span>
        </button>

        <button
          id="tab-btn-string-calculator"
          onClick={() => setActiveTab('stringCalculator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'stringCalculator'
              ? 'bg-neutral-800 text-purple-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>String Calc</span>
        </button>

        <button
          id="tab-btn-date-calculator"
          onClick={() => setActiveTab('dateCalculator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'dateCalculator'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Date Calc</span>
        </button>

        <button
          id="tab-btn-form"
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'form'
              ? 'bg-neutral-800 text-indigo-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Outline Form</span>
        </button>

        <button
          id="tab-btn-branch-table"
          onClick={() => setActiveTab('branchTable')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition ${
            activeTab === 'branchTable'
              ? 'bg-neutral-800 text-rose-400 border border-neutral-700 shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Branch Predicates</span>
        </button>
      </div>

      {/* Copy notification toast */}
      {copiedNotification && (
        <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs px-3 py-1 text-center font-mono">
          Copied {copiedNotification} to clipboard
        </div>
      )}

      {/* Active Panel View */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. RPN CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="text-xs text-neutral-400 font-mono flex items-center justify-between mb-1.5">
                <span>RPN ACCUMULATOR & STACK (Carlson Page 4)</span>
                <span className="text-blue-400 font-bold">{state.calculator.lastOp}</span>
              </div>
              <div className="bg-black rounded border border-neutral-800 p-3 font-mono space-y-1">
                <div className="text-right text-xs text-neutral-500">
                  Z: {state.calculator.stack[state.calculator.stack.length - 3] ?? '0.00'}
                </div>
                <div className="text-right text-xs text-neutral-400">
                  Y: {state.calculator.stack[state.calculator.stack.length - 2] ?? '0.00'}
                </div>
                <div className="text-right text-2xl font-black text-blue-400 tracking-wider">
                  X: {state.calculator.stack[state.calculator.stack.length - 1] ?? 0}
                </div>
              </div>
            </div>

            {/* Calculator Keypad */}
            <div className="grid grid-cols-4 gap-2 font-mono text-sm">
              <button
                onClick={() => handleRpnOp('CLEAR')}
                className="p-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-bold transition"
              >
                CLR
              </button>
              <button
                onClick={() => handleRpnOp('SWAP')}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                SWAP
              </button>
              <button
                onClick={() => handleRpnOp('/')}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded font-bold transition"
              >
                ÷
              </button>
              <button
                onClick={() => handleRpnOp('*')}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded font-bold transition"
              >
                ×
              </button>

              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRpnNum(d)}
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded transition"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleRpnOp('-')}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded font-bold transition"
              >
                -
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRpnNum(d)}
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded transition"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleRpnOp('+')}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded font-bold transition"
              >
                +
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRpnNum(d)}
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded transition"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleRpnOp('ENTER')}
                className="row-span-2 p-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold flex items-center justify-center transition"
              >
                ENTER
              </button>

              <button
                onClick={() => handleRpnNum('0')}
                className="col-span-2 p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                0
              </button>
              <button
                onClick={() => handleRpnOp('+')}
                title="Single increment (+1) for EDI segment counters"
                className="p-2.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 rounded font-bold transition"
              >
                +1
              </button>
            </div>
          </div>
        )}

        {/* 2. OUTPUT DOCUMENT */}
        {activeTab === 'outputDoc' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-neutral-400">
                OUTPUT DOCUMENT (Stream Target) · Cursor: Line{' '}
                <span className="text-emerald-400 font-bold">{state.outputDoc.cursor.line}</span>, Col{' '}
                <span className="text-emerald-400 font-bold">{state.outputDoc.cursor.col}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(state.outputDoc.content, 'Output Document')}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-3 font-mono text-xs overflow-y-auto whitespace-pre leading-relaxed">
              {state.outputDoc.content ? (
                state.outputDoc.content.split('\n').map((line, lIdx) => {
                  const isCursorLine = lIdx === state.outputDoc.cursor.line;
                  return (
                    <div
                      key={lIdx}
                      className={`flex gap-3 px-1.5 py-0.5 rounded ${
                        isCursorLine ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200' : 'hover:bg-neutral-800/40'
                      }`}
                    >
                      <span className="text-neutral-600 select-none w-6 text-right shrink-0">
                        {lIdx + 1}
                      </span>
                      <span className="flex-1">{line || ' '}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-neutral-500 italic p-4 text-center">
                  Output document is empty. Execute Step/Play to emit records.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. INPUT DOCUMENT */}
        {activeTab === 'inputDoc' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-mono text-neutral-400">
                INPUT DOCUMENT (Source File) · Cursor: Line{' '}
                <span className="text-sky-400 font-bold">{state.inputDoc.cursor.line}</span>
              </div>
              <button
                onClick={() =>
                  onUpdateState((prev) => {
                    const next = JSON.parse(JSON.stringify(prev));
                    next.inputDoc.cursor = { line: 0, col: 0 };
                    return next;
                  })
                }
                title="Reset Cursor to Top (Carlson Page 5)"
                className="flex items-center gap-1 text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Top</span>
              </button>
            </div>

            <textarea
              value={state.inputDoc.content}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateState((prev) => {
                  const next = JSON.parse(JSON.stringify(prev));
                  next.inputDoc.content = val;
                  return next;
                });
              }}
              rows={12}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        )}

        {/* 4. STRING CALCULATOR */}
        {activeTab === 'stringCalculator' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="text-xs text-neutral-400 font-mono flex items-center justify-between">
                <span>STRING BUFFER (Carlson Page 5)</span>
                <span className="text-purple-400 font-bold">{state.stringCalculator.lastOp}</span>
              </div>
              <input
                type="text"
                value={state.stringCalculator.buffer}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateState((prev) => {
                    const next = JSON.parse(JSON.stringify(prev));
                    next.stringCalculator.buffer = val;
                    return next;
                  });
                }}
                className="w-full bg-black border border-neutral-700 rounded p-2.5 font-mono text-sm text-purple-300 focus:outline-none"
              />
              <div className="text-[11px] text-neutral-500 font-mono">
                Length: {state.stringCalculator.buffer.length} characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStringTransform('trim')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Trim Whitespace
              </button>
              <button
                onClick={() => handleStringTransform('justifyLeft')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Justify Left (W=20)
              </button>
              <button
                onClick={() => handleStringTransform('justifyRight')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Justify Right (W=20)
              </button>
              <button
                onClick={() => handleStringTransform('justifyCenter')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Justify Center (W=20)
              </button>
              <button
                onClick={() => handleStringTransform('upper')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Uppercase
              </button>
              <button
                onClick={() => handleStringTransform('lower')}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                Lowercase
              </button>
            </div>
          </div>
        )}

        {/* 5. DATE CALCULATOR */}
        {activeTab === 'dateCalculator' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="text-xs text-neutral-400 font-mono flex items-center justify-between">
                <span>DATE ENGINE (Carlson Page 5)</span>
                <span className="text-amber-400 font-mono">Offset: {state.dateCalculator.offsetDays}d</span>
              </div>
              <div className="bg-black border border-neutral-700 rounded p-3 text-center">
                <div className="text-2xl font-black font-mono text-amber-400">
                  {state.dateCalculator.currentDate}
                </div>
                <div className="text-xs font-mono text-neutral-400 mt-1">
                  EDI Standard YYYYMMDD: {state.dateCalculator.currentDate.replace(/-/g, '')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDateOffset(1)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                +1 Day
              </button>
              <button
                onClick={() => handleDateOffset(-1)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                -1 Day
              </button>
              <button
                onClick={() => handleDateOffset(7)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                +1 Week
              </button>
              <button
                onClick={() => handleDateOffset(30)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono transition"
              >
                +30 Days (Net 30)
              </button>
            </div>
          </div>
        )}

        {/* 6. FORM OUTLINE (XML / EDI TREE) */}
        {activeTab === 'form' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>OUTLINE TREE VIEWER (Carlson Page 5-6)</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  state.form.status === 'OK'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                Status: {state.form.status}
              </span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto">
              {(() => {
                const renderNode = (node: any, depth: number = 0) => {
                  const isSelected = node.id === state.form.selectedId;
                  return (
                    <div key={node.id} style={{ paddingLeft: `${depth * 14}px` }}>
                      <div
                        onClick={() =>
                          onUpdateState((prev) => {
                            const next = JSON.parse(JSON.stringify(prev));
                            next.form.selectedId = node.id;
                            return next;
                          })
                        }
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-950/80 border border-indigo-600 text-indigo-200 font-bold'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[10px] px-1 py-0.2 bg-neutral-800 rounded text-neutral-400">
                          {node.type}
                        </span>
                        <span>{node.name}</span>
                        {node.value && (
                          <span className="text-neutral-500 text-[11px] truncate">
                            = &quot;{node.value}&quot;
                          </span>
                        )}
                      </div>
                      {node.children &&
                        node.children.map((child: any) => renderNode(child, depth + 1))}
                    </div>
                  );
                };
                return renderNode(state.form.root);
              })()}
            </div>
          </div>
        )}

        {/* 7. BRANCH PREDICATE TABLE */}
        {activeTab === 'branchTable' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-400">
              BRANCH PREDICATE EVALUATOR MATRIX (Carlson Page 5)
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="text-xs font-mono text-neutral-400 mb-2">
                Active Test Keys:
              </div>
              <div className="space-y-1.5">
                {Object.entries(state.branchKeys).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between p-2 rounded bg-black border border-neutral-800 font-mono text-xs"
                  >
                    <span className="text-neutral-400">{k}:</span>
                    <span className="text-amber-400 font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-neutral-400">Guarded Procedures:</div>
              <div className="border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs">
                <div className="grid grid-cols-3 bg-neutral-900 p-2 font-bold text-neutral-300 border-b border-neutral-800">
                  <div>Predicate</div>
                  <div>Condition</div>
                  <div>Outcome</div>
                </div>
                <div className="grid grid-cols-3 p-2 bg-neutral-950/80 border-b border-neutral-900">
                  <div className="text-rose-400">Index == 24</div>
                  <div className="text-neutral-400">Equal to 24</div>
                  <div className="text-emerald-400">Terminate Loop</div>
                </div>
                <div className="grid grid-cols-3 p-2 bg-neutral-950/80">
                  <div className="text-amber-400">Index != 24</div>
                  <div className="text-neutral-400">Anything Else</div>
                  <div className="text-blue-400">Increment & Output</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
