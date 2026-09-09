/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Language Spec & C++ CodeGen Component
 * Formal 4-Dimensional Programming Language Specification &
 * Carlson's C++ Repository Constructor Code Generator (Page 9 of paper).
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Code,
  BookOpen,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { MapOperation } from '../types';

interface LanguageSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: MapOperation[];
  activeBlueprintName: string;
}

export const LanguageSpecModal: React.FC<LanguageSpecModalProps> = ({
  isOpen,
  onClose,
  operations,
  activeBlueprintName
}) => {
  const [activeTab, setActiveTab] = useState<'SPEC' | 'CPP_CODEGEN' | 'PAPER_ANALYSIS'>('SPEC');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Generate Carlson's C++ Object Repository Code (as described in paper Page 9)
  const generatedCpp = useMemo(() => {
    let code = `// =======================================================================\n`;
    code += `// Translator's Workbench & Engine (TWB/TE) - C++ Object Repository\n`;
    code += `// Generated from 4D Map Blueprint: ${activeBlueprintName}\n`;
    code += `// Grounded in J.W. Carlson (LLNL / OOPSLA 2001, Page 9)\n`;
    code += `// =======================================================================\n\n`;
    code += `#include "twb_engine.h"\n#include "desktop_objects.h"\n#include "reversible_interpreter.h"\n\n`;
    code += `namespace Twb4D {\n\n`;
    code += `// Global Desktop Objects\n`;
    code += `RPNCalculator*      g_calc        = new RPNCalculator("calculator");\n`;
    code += `StringCalculator*   g_strCalc     = new StringCalculator("stringCalculator");\n`;
    code += `DateCalculator*     g_dateCalc    = new DateCalculator("dateCalculator");\n`;
    code += `TextDocument*       g_inputDoc    = new TextDocument("inputDoc");\n`;
    code += `TextDocument*       g_outputDoc   = new TextDocument("outputDoc");\n`;
    code += `OutlineForm*        g_outlineForm = new OutlineForm("form");\n`;
    code += `BranchTable*        g_branchTable = new BranchTable("branchTable");\n\n`;

    code += `// 4-Dimensional Operation Repository Declarations\n`;
    operations.forEach((op, i) => {
      const c = op.coord;
      const coordStr = `Coord4D(${c.x}, ${c.y}, ${c.z}, ${c.t})`;
      if (op.type === 'Create/Show') {
        code += `ShowOp* op_${i} = new ShowOp("${op.params.targetObject}", ${coordStr});\n`;
      } else if (op.type === 'Arithmetic') {
        code += `ArithmeticOp* op_${i} = new ArithmeticOp(g_calc, "${op.params.arithmeticOp || '+'}", ${op.params.arithmeticValue ?? 0}, ${coordStr});\n`;
      } else if (op.type === 'Copy') {
        const src = op.params.copyFrom?.object || 'calc';
        const dst = op.params.copyTo?.object || 'outputDoc';
        code += `CopyOp* op_${i} = new CopyOp("${src}", "${dst}", ${coordStr});\n`;
      } else if (op.type === 'Lookup') {
        code += `LookupOp* op_${i} = new LookupOp(g_branchTable, "Index", ${coordStr});\n`;
      } else if (op.type === 'Move Text Location') {
        const off = op.params.offset || { dLine: 1, dCol: 0 };
        code += `MoveLocationOp* op_${i} = new MoveLocationOp(g_outputDoc, ${off.dLine}, ${off.dCol}, ${coordStr});\n`;
      } else if (op.type === 'Loop') {
        code += `LoopOp* op_${i} = new LoopOp(g_branchTable, ${coordStr});\n`;
      } else {
        code += `GenericOp* op_${i} = new GenericOp("${op.type}", "${op.label}", ${coordStr});\n`;
      }
    });

    code += `\n// Engine Bootstrap and Repository Registration\n`;
    code += `void RegisterMapRepository(TranslatorEngine* engine) {\n`;
    operations.forEach((_, i) => {
      code += `  engine->registerOperation(op_${i});\n`;
    });
    code += `}\n\n`;

    code += `int main(int argc, char** argv) {\n`;
    code += `  TranslatorEngine engine(std::cin, std::cout);\n`;
    code += `  RegisterMapRepository(&engine);\n`;
    code += `  std::cout << "[TE] Running 4D Reversible Mapping Engine..." << std::endl;\n`;
    code += `  return engine.executeReversible();\n`;
    code += `}\n\n`;
    code += `} // namespace Twb4D\n`;

    return code;
  }, [operations, activeBlueprintName]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCpp);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                4-Dimensional Visual Language Formal Architecture
              </h2>
              <p className="text-xs text-neutral-400">
                Grounded in J.W. Carlson (Lawrence Livermore National Laboratory / OOPSLA 2001)
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('SPEC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition ${
              activeTab === 'SPEC'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formal 4D Coordinate System</span>
          </button>
          <button
            onClick={() => setActiveTab('CPP_CODEGEN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition ${
              activeTab === 'CPP_CODEGEN'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>C++ Object Repository (Page 9)</span>
          </button>
          <button
            onClick={() => setActiveTab('PAPER_ANALYSIS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold transition ${
              activeTab === 'PAPER_ANALYSIS'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>LLNL Paper Analysis</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-neutral-200">
          {activeTab === 'SPEC' && (
            <div className="space-y-6 text-sm leading-relaxed">
              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-950/70 space-y-2">
                <h3 className="text-base font-bold text-amber-400 font-mono">
                  1. Mathematical Definition of the 4D Spacetime Tuple
                </h3>
                <p className="text-neutral-300">
                  Every element, operation, and data state in the language is uniquely parameterized by a
                  4-dimensional spacetime vector:
                </p>
                <div className="p-3 bg-black border border-neutral-800 rounded font-mono text-xs text-amber-300">
                  P(x, y, z, t) ∈ (Domains × Tape × Depth × Timeline)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-neutral-900 border border-sky-800/40">
                    <strong className="text-sky-400 block mb-1">X: Semantic Domain / Branch Column</strong>
                    Horizontal axis spanning desktop object domains (-2: InputDoc, -1: FormTree, 0:
                    BranchDispatcher, +1: Calculators, +2: OutputDoc) and parallel predicate alternatives
                    (Figure 1).
                  </div>
                  <div className="p-2.5 rounded bg-neutral-900 border border-emerald-800/40">
                    <strong className="text-emerald-400 block mb-1">Y: Instruction Sequence / Tape</strong>
                    Vertical axis ordering operations top-to-bottom within each procedure, tracking cursor
                    progressions through documents.
                  </div>
                  <div className="p-2.5 rounded bg-neutral-900 border border-purple-800/40">
                    <strong className="text-purple-400 block mb-1">Z: Structural Hierarchy Depth</strong>
                    Perpendicular depth axis representing call-stack nesting, tree outline depth
                    (interchange → transaction → segment → element), and sub-procedure scopes.
                  </div>
                  <div className="p-2.5 rounded bg-neutral-900 border border-amber-800/40">
                    <strong className="text-amber-400 block mb-1">T: Temporal Reversibility</strong>
                    Temporal coordinate enabling complete forward/backward execution (Unstep, Unplay,
                    Time-Scrubbing, and live dynamic instruction insertion).
                  </div>
                </div>
              </div>

              <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-950/70 space-y-2">
                <h3 className="text-base font-bold text-emerald-400 font-mono">
                  2. Operational Semantics & Reversible Delta Tuple
                </h3>
                <p className="text-neutral-300 text-xs">
                  In Carlson&apos;s system, every operation is inherently undoable:
                </p>
                <div className="p-3 bg-black border border-neutral-800 rounded font-mono text-xs text-emerald-300">
                  Δ_t = ⟨Op_id, Coord4D(x, y, z, t), σ_before, σ_after, π_branch⟩
                </div>
                <p className="text-xs text-neutral-400">
                  Forward evaluation applies σ_after = Eval(Op, σ_before); reverse evaluation applies
                  σ_before = UnEval(Op, σ_after). Because all transitions are bijective across (x, y, z, t),
                  breakpoints can be crossed in both temporal directions.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CPP_CODEGEN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-400">
                  C++ Constructor Code as described in &ldquo;Code Generation&rdquo; section (Page 9)
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded font-medium transition text-neutral-200"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy C++ Code'}</span>
                </button>
              </div>

              <pre className="bg-black border border-neutral-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed max-h-[500px]">
                {generatedCpp}
              </pre>
            </div>
          )}

          {activeTab === 'PAPER_ANALYSIS' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h4 className="font-bold text-amber-400 text-sm">
                  Carlson (2001): The Reversible Interpreter & Flowchart Metaphor
                </h4>
                <blockquote className="border-l-2 border-amber-500 pl-3 italic text-neutral-300">
                  &ldquo;The TWB is a reversible debugging interpreter. You can set breakpoints, run the
                  mapping backwards and forwards, and you can insert new operations at the current
                  operation—you can actually add new operations while a mapping is running in the TWB, if you
                  desire.&rdquo; (Page 4)
                </blockquote>
                <p className="text-neutral-400">
                  This capability forms the foundation of our 4th dimension (T). Modern systems call this
                  Time-Travel Debugging; Carlson and the LLNL team implemented it in 1991–2001 for military EDI
                  and Bank of America Internet financial transactions.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <h4 className="font-bold text-sky-400 text-sm">
                  Figure 1 Architecture: RPN Stack, Branch Predicates, and Loops
                </h4>
                <blockquote className="border-l-2 border-sky-500 pl-3 italic text-neutral-300">
                  &ldquo;Either the item copied into the branch is &lsquo;24&rsquo; or it&apos;s anything else... When the value
                  isn&apos;t 24, 1 is added to it in the calculator, and the value is copied into the branch again,
                  and as well, the value is copied into the output document... the conditional branch is tested
                  again.&rdquo; (Page 8)
                </blockquote>
                <p className="text-neutral-400">
                  Our system models this branch division across the X coordinate plane, rendering the exact
                  flowchart columns illustrated in Figure 1.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
