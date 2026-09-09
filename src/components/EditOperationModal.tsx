/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Edit Operation Modal
 * Allows concurrent programmers to edit operation parameters,
 * labels, 4D coordinates, arithmetic ops, copy endpoints, and cursors.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calculator,
  CornerDownRight,
  Copy,
  Sliders,
  Sparkles
} from 'lucide-react';
import { MapOperation, OperationType } from '../types';

interface EditOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: MapOperation | null;
  onSave: (updatedOp: MapOperation) => void;
}

export const EditOperationModal: React.FC<EditOperationModalProps> = ({
  isOpen,
  onClose,
  operation,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<OperationType>('Arithmetic');
  const [arithmeticOp, setArithmeticOp] = useState<'ENTER' | '+' | '-' | '*' | '/' | 'SWAP' | 'PUSH' | 'POP' | 'CLEAR'>('ENTER');
  const [arithmeticValue, setArithmeticValue] = useState<string>('');
  const [coordX, setCoordX] = useState<number>(0);
  const [coordY, setCoordY] = useState<number>(0);
  const [coordZ, setCoordZ] = useState<number>(0);
  const [dLine, setDLine] = useState<number>(1);
  const [dCol, setDCol] = useState<number>(0);
  const [copyFromObj, setCopyFromObj] = useState<string>('calculator');
  const [copyToObj, setCopyToObj] = useState<string>('outputDoc');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (operation) {
      setLabel(operation.label || '');
      setType(operation.type);
      setArithmeticOp(operation.params.arithmeticOp || 'ENTER');
      setArithmeticValue(
        operation.params.arithmeticValue !== undefined ? String(operation.params.arithmeticValue) : ''
      );
      setCoordX(operation.coord.x);
      setCoordY(operation.coord.y);
      setCoordZ(operation.coord.z);
      setDLine(operation.params.offset?.dLine ?? 1);
      setDCol(operation.params.offset?.dCol ?? 0);
      setCopyFromObj(operation.params.copyFrom?.object || 'calculator');
      setCopyToObj(operation.params.copyTo?.object || 'outputDoc');
      setDescription(operation.params.description || '');
    }
  }, [operation]);

  if (!isOpen || !operation) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedOp: MapOperation = {
      ...operation,
      label: label.trim() || operation.label,
      type,
      coord: {
        ...operation.coord,
        x: Number(coordX),
        y: Number(coordY),
        z: Number(coordZ)
      },
      params: {
        ...operation.params,
        description: description.trim() || undefined,
        arithmeticOp: type === 'Arithmetic' ? arithmeticOp : operation.params.arithmeticOp,
        arithmeticValue:
          type === 'Arithmetic' && arithmeticValue !== ''
            ? isNaN(Number(arithmeticValue))
              ? arithmeticValue
              : Number(arithmeticValue)
            : operation.params.arithmeticValue,
        offset:
          type === 'Move Text Location'
            ? { dLine: Number(dLine), dCol: Number(dCol) }
            : operation.params.offset,
        copyFrom:
          type === 'Copy'
            ? { object: copyFromObj, field: 'top' }
            : operation.params.copyFrom,
        copyTo:
          type === 'Copy'
            ? { object: copyToObj, field: 'cursor' }
            : operation.params.copyTo
      }
    };

    onSave(updatedOp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                <span>Collaborative Operation Editor</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300">
                  {operation.id}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Live modifications sync instantly to all connected programmers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Label */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Operation Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Operation Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Operation Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OperationType)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Arithmetic">Arithmetic (RPN)</option>
                <option value="Copy">Copy Data</option>
                <option value="Move Text Location">Move Text Location</option>
                <option value="Lookup">Lookup Branch</option>
                <option value="Loop">Loop</option>
                <option value="Create/Show">Create / Show Object</option>
                <option value="Justify">Justify String</option>
                <option value="Ack">EDI Ack</option>
                <option value="Extend">Extend Form</option>
              </select>
            </div>

            {/* Arithmetic Options */}
            {type === 'Arithmetic' && (
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">RPN Operator</label>
                <select
                  value={arithmeticOp}
                  onChange={(e) => setArithmeticOp(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="ENTER">ENTER (Dup)</option>
                  <option value="+">+ (Add)</option>
                  <option value="-">- (Sub)</option>
                  <option value="*">* (Mul)</option>
                  <option value="/">/ (Div)</option>
                  <option value="CLEAR">CLEAR</option>
                  <option value="PUSH">PUSH Value</option>
                  <option value="POP">POP</option>
                  <option value="SWAP">SWAP</option>
                </select>
              </div>
            )}
          </div>

          {/* Arithmetic Value if PUSH or CLEAR or + */}
          {type === 'Arithmetic' && ['PUSH', 'CLEAR', '+', '-', '*', '/'].includes(arithmeticOp) && (
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Operand Value (Numeric or String)
              </label>
              <input
                type="text"
                value={arithmeticValue}
                onChange={(e) => setArithmeticValue(e.target.value)}
                placeholder="e.g. 1, 24, 0"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Text Location Offsets */}
          {type === 'Move Text Location' && (
            <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Δ Line</label>
                <input
                  type="number"
                  value={dLine}
                  onChange={(e) => setDLine(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Δ Column</label>
                <input
                  type="number"
                  value={dCol}
                  onChange={(e) => setDCol(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Copy Endpoints */}
          {type === 'Copy' && (
            <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Copy Source</label>
                <select
                  value={copyFromObj}
                  onChange={(e) => setCopyFromObj(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 text-xs"
                >
                  <option value="calculator">RPN Calculator [X]</option>
                  <option value="stringCalculator">String Calculator</option>
                  <option value="dateCalculator">Date Calculator</option>
                  <option value="inputDoc">Input Document</option>
                  <option value="form">Outline Form</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Copy Destination</label>
                <select
                  value={copyToObj}
                  onChange={(e) => setCopyToObj(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 text-xs"
                >
                  <option value="outputDoc">Output Document</option>
                  <option value="branchTable">Branch Evaluator [Index]</option>
                  <option value="calculator">RPN Calculator</option>
                  <option value="stringCalculator">String Calculator</option>
                </select>
              </div>
            </div>
          )}

          {/* 4D Coordinates */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">
              4D Coordinates (Domain X, Tape Y, Depth Z)
            </label>
            <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono">X (Domain)</span>
                <input
                  type="number"
                  value={coordX}
                  onChange={(e) => setCoordX(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-100 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono">Y (Tape Seq)</span>
                <input
                  type="number"
                  value={coordY}
                  onChange={(e) => setCoordY(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-100 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono">Z (Depth)</span>
                <input
                  type="number"
                  value={coordZ}
                  onChange={(e) => setCoordZ(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-100 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Description / Paper Reference</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. LLNL payment remittance processing"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Broadcast Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
