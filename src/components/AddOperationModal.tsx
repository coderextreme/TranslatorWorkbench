/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Add Operation Modal Component
 * Live operation injection into running 4D mapping (Carlson Page 4).
 */

import React, { useState } from 'react';
import { X, Plus, Play, Sparkles } from 'lucide-react';
import { MapOperation, OperationType, DesktopObjectType } from '../types';

interface AddOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  insertIndex: number;
  onInsertOp: (newOp: MapOperation, index: number) => void;
}

export const AddOperationModal: React.FC<AddOperationModalProps> = ({
  isOpen,
  onClose,
  insertIndex,
  onInsertOp
}) => {
  const [opType, setOpType] = useState<OperationType>('Arithmetic');
  const [label, setLabel] = useState<string>('RPN: Push 5');
  const [targetObject, setTargetObject] = useState<DesktopObjectType>('calculator');
  const [arithmeticOp, setArithmeticOp] = useState<'ENTER' | '+' | '-' | '*' | '/' | 'PUSH' | 'CLEAR'>('+');
  const [arithmeticVal, setArithmeticVal] = useState<string>('1');
  const [domainX, setDomainX] = useState<number>(1);
  const [depthZ, setDepthZ] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOp: MapOperation = {
      id: `op-custom-${Date.now()}`,
      type: opType,
      label: label.trim() || `${opType} Op`,
      coord: {
        x: domainX,
        y: insertIndex,
        z: depthZ,
        t: 0
      },
      params: {
        targetObject,
        arithmeticOp,
        arithmeticValue: parseFloat(arithmeticVal) || 0,
        description: `Custom live-inserted operation at step ${insertIndex}`
      }
    };

    onInsertOp(newOp, insertIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                Live Operation Injection
              </h3>
              <p className="text-xs text-neutral-400">
                Insert operation at index {insertIndex} while program is running (Carlson Page 4)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono text-neutral-200">
          <div>
            <label className="block text-neutral-400 mb-1">Operation Type</label>
            <select
              value={opType}
              onChange={(e) => {
                const val = e.target.value as OperationType;
                setOpType(val);
                if (val === 'Arithmetic') {
                  setLabel('RPN: Add (+)');
                  setDomainX(1);
                } else if (val === 'Copy') {
                  setLabel('Copy Calc -> Output');
                  setDomainX(2);
                } else if (val === 'Move Text Location') {
                  setLabel('Move Text Location [+1, 0]');
                  setDomainX(2);
                } else if (val === 'Justify') {
                  setLabel('Justify Left [Width 20]');
                  setDomainX(1);
                }
              }}
              className="w-full bg-black border border-neutral-700 rounded p-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="Arithmetic">Arithmetic (RPN Calculator)</option>
              <option value="Copy">Copy (Cross-Domain)</option>
              <option value="Move Text Location">Move Text Location</option>
              <option value="Justify">Justify (String Calculator)</option>
              <option value="Trim">Trim (String Calculator)</option>
              <option value="Create/Show">Create/Show Desktop Object</option>
              <option value="Loop">Loop (Jump to Branch Top)</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Operation Label / Display</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded p-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {opType === 'Arithmetic' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Arithmetic Action</label>
                <select
                  value={arithmeticOp}
                  onChange={(e) => setArithmeticOp(e.target.value as any)}
                  className="w-full bg-black border border-neutral-700 rounded p-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="+">+ (Add)</option>
                  <option value="-">- (Subtract)</option>
                  <option value="*">* (Multiply)</option>
                  <option value="/">/ (Divide)</option>
                  <option value="ENTER">ENTER (Duplicate)</option>
                  <option value="PUSH">PUSH (Value)</option>
                  <option value="CLEAR">CLEAR</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Operand Value</label>
                <input
                  type="number"
                  value={arithmeticVal}
                  onChange={(e) => setArithmeticVal(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded p-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-neutral-400 mb-1">4D Domain (X Coordinate)</label>
              <input
                type="number"
                value={domainX}
                onChange={(e) => setDomainX(parseInt(e.target.value, 10))}
                className="w-full bg-black border border-neutral-700 rounded p-2 text-sky-400 focus:border-sky-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">-2: Input, 0: Branch, 1: Calc, 2: Output</span>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">4D Depth (Z Coordinate)</label>
              <input
                type="number"
                value={depthZ}
                onChange={(e) => setDepthZ(parseInt(e.target.value, 10))}
                className="w-full bg-black border border-neutral-700 rounded p-2 text-purple-400 focus:border-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">0: Enclosing, 1: Procedure, 2: Sub-element</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Operation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
