/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Presets grounded directly in J.W. Carlson's paper
 * "A Visual Language for Data Mapping" (LLNL / OOPSLA 2001)
 */

import { ProgramBlueprint, FormOutlineNode } from '../types';

/**
 * Figure 1 from the paper:
 * "an example of the visual language mapping required to create an output document
 * containing a list of numbers, one on each line."
 * Features RPN Calculator, Branch with predicates ("is 24" / "not 24"),
 * ENTER, 1, +, Copy, Move Text Location [+1, +0], and LOOP.
 */
export const figure1Preset: ProgramBlueprint = {
  id: 'fig1-loop-counter',
  name: 'Figure 1: Reversible Loop Counter (0..24)',
  description: 'Faithful recreation of Figure 1 from Carlson\'s paper: RPN counter with branch predicate ("Index 24" vs "Index Anything"), cursor advance [+1, +0], and LOOP construct.',
  paperReference: 'Page 7-8, Figure 1. Recorder & "Example of constructs"',
  initialInputText: 'LOOP_INITIAL_INDEX=0\nLIMIT=24',
  operations: [
    {
      id: 'op-0',
      type: 'Create/Show',
      label: 'Show RPN Calculator',
      coord: { x: 1, y: 0, z: 0, t: 0 },
      params: { targetObject: 'calculator', description: 'Initialize RPN Calculator' }
    },
    {
      id: 'op-1',
      type: 'Create/Show',
      label: 'Show Output Document',
      coord: { x: 2, y: 1, z: 0, t: 1 },
      params: { targetObject: 'outputDoc', description: 'Create target stream for generated lines' }
    },
    {
      id: 'op-2',
      type: 'Arithmetic',
      label: 'RPN: Clear & Push 0',
      coord: { x: 1, y: 2, z: 0, t: 2 },
      params: { targetObject: 'calculator', arithmeticOp: 'CLEAR', arithmeticValue: 0 }
    },
    {
      id: 'op-3',
      type: 'Copy',
      label: 'Copy Calc[X] -> Branch[Index]',
      coord: { x: 0, y: 3, z: 0, t: 3 },
      params: {
        copyFrom: { object: 'calculator', field: 'top' },
        copyTo: { object: 'branchTable', field: 'Index' },
        description: 'Test key copied into branch predicate evaluator'
      }
    },
    {
      id: 'op-4',
      type: 'Lookup',
      label: 'Lookup Branch [Index == 24 ?]',
      coord: { x: 0, y: 4, z: 0, t: 4 },
      params: {
        targetObject: 'branchTable',
        branchPredicates: [
          {
            id: 'pred-24',
            label: 'Index 24 (is 24)',
            condition: 'is 24',
            expectedValue: 24,
            procedureId: 'proc-halt'
          },
          {
            id: 'pred-anything',
            label: 'Index Anything (not 24)',
            condition: 'not 24',
            procedureId: 'proc-increment-and-write'
          }
        ]
      }
    },
    // The "not 24" procedure body (Figure 1 operations):
    {
      id: 'op-5',
      type: 'Arithmetic',
      label: 'RPN: ENTER',
      coord: { x: 1, y: 5, z: 1, t: 5 },
      params: { targetObject: 'calculator', arithmeticOp: 'ENTER', description: 'Duplicate top of stack' }
    },
    {
      id: 'op-6',
      type: 'Arithmetic',
      label: 'RPN: Push 1',
      coord: { x: 1, y: 6, z: 1, t: 6 },
      params: { targetObject: 'calculator', arithmeticOp: 'PUSH', arithmeticValue: 1 }
    },
    {
      id: 'op-7',
      type: 'Arithmetic',
      label: 'RPN: + (Add)',
      coord: { x: 1, y: 7, z: 1, t: 7 },
      params: { targetObject: 'calculator', arithmeticOp: '+', description: 'Increment accumulator' }
    },
    {
      id: 'op-8',
      type: 'Copy',
      label: 'Copy Calc -> Output Doc',
      coord: { x: 2, y: 8, z: 1, t: 8 },
      params: {
        copyFrom: { object: 'calculator', field: 'top' },
        copyTo: { object: 'outputDoc', field: 'cursor' },
        description: 'Write incremented number to output document'
      }
    },
    {
      id: 'op-9',
      type: 'Move Text Location',
      label: 'Move Text Location [+1, +0]',
      coord: { x: 2, y: 9, z: 1, t: 9 },
      params: {
        targetObject: 'outputDoc',
        offset: { dLine: 1, dCol: 0 },
        description: 'Advance cursor to newline for next output'
      }
    },
    {
      id: 'op-10',
      type: 'Copy',
      label: 'Copy Calc -> Branch[Index]',
      coord: { x: 0, y: 10, z: 1, t: 10 },
      params: {
        copyFrom: { object: 'calculator', field: 'top' },
        copyTo: { object: 'branchTable', field: 'Index' }
      }
    },
    {
      id: 'op-11',
      type: 'Loop',
      label: 'LOOP: Jump to Branch Top',
      coord: { x: 0, y: 11, z: 0, t: 11 },
      params: {
        targetObject: 'branchTable',
        description: 'Re-evaluate enclosing predicate with updated index'
      }
    }
  ]
};

/**
 * EDI 820 Financial Payment Translator
 * As detailed in paper page 4:
 * "mapped a database table dump of invoice payments to the EDI/X12 820 transaction set
 * between LLNL and the Bank of America... count the number of segments we were producing".
 */
export const edi820Preset: ProgramBlueprint = {
  id: 'edi820-payment',
  name: 'EDI 820: LLNL / Bank of America Financial Payment',
  description: 'First secure financial EDI payment over the Internet (LLNL to Bank of America). Reads invoice records, generates X12 820 segments (ST, BPR, TRN, N1, RMR), tracks segment counts via RPN calculator, and emits trailer SE segment.',
  paperReference: 'Page 4, Paragraph 2 & Page 8 "Ack and segment counting"',
  initialInputText: `PAYMENT_ID: 981042-BOA
PAYER_NAME: LAWRENCE LIVERMORE NATL LAB
PAYER_DUNS: 001928374
PAYEE_NAME: BANK OF AMERICA
PAYEE_ABA: 121000358
ACCOUNT_NO: 4892019482
INVOICE_NUM: INV-2001-9041
AMOUNT_USD: 145250.00
DATE: 20011014`,
  operations: [
    {
      id: 'edi-0',
      type: 'Create/Show',
      label: 'Show RPN Segment Calculator',
      coord: { x: 1, y: 0, z: 0, t: 0 },
      params: { targetObject: 'calculator', description: 'Track EDI segment count' }
    },
    {
      id: 'edi-1',
      type: 'Create/Show',
      label: 'Show Date Calculator',
      coord: { x: 1, y: 1, z: 0, t: 1 },
      params: { targetObject: 'dateCalculator', description: 'Format banking transaction timestamps' }
    },
    {
      id: 'edi-2',
      type: 'Arithmetic',
      label: 'RPN: Clear Segment Counter',
      coord: { x: 1, y: 2, z: 0, t: 2 },
      params: { targetObject: 'calculator', arithmeticOp: 'CLEAR', arithmeticValue: 0 }
    },
    {
      id: 'edi-3',
      type: 'Copy',
      label: 'Emit ST*820*0001~ (Header)',
      coord: { x: 2, y: 3, z: 0, t: 3 },
      params: {
        copyTo: { object: 'outputDoc' },
        description: 'Write EDI ST segment and increment segment counter'
      }
    },
    {
      id: 'edi-4',
      type: 'Arithmetic',
      label: 'RPN: Push 1 & +',
      coord: { x: 1, y: 4, z: 0, t: 4 },
      params: { targetObject: 'calculator', arithmeticOp: '+', arithmeticValue: 1 }
    },
    {
      id: 'edi-5',
      type: 'Copy',
      label: 'Emit BPR*I*145250.00*C*ACH*CTX*01~',
      coord: { x: 2, y: 5, z: 0, t: 5 },
      params: {
        copyTo: { object: 'outputDoc' },
        description: 'Financial BPR Payment Order / Remittance Advice'
      }
    },
    {
      id: 'edi-6',
      type: 'Arithmetic',
      label: 'RPN: Count BPR (+1)',
      coord: { x: 1, y: 6, z: 0, t: 6 },
      params: { targetObject: 'calculator', arithmeticOp: '+', arithmeticValue: 1 }
    },
    {
      id: 'edi-7',
      type: 'Copy',
      label: 'Emit TRN*1*981042-BOA*1928374~',
      coord: { x: 2, y: 7, z: 0, t: 7 },
      params: {
        copyTo: { object: 'outputDoc' },
        description: 'Trace identification'
      }
    },
    {
      id: 'edi-8',
      type: 'Arithmetic',
      label: 'RPN: Count TRN (+1)',
      coord: { x: 1, y: 8, z: 0, t: 8 },
      params: { targetObject: 'calculator', arithmeticOp: '+', arithmeticValue: 1 }
    },
    {
      id: 'edi-9',
      type: 'Copy',
      label: 'Emit N1*PR*LAWRENCE LIVERMORE NATL LAB~',
      coord: { x: 2, y: 9, z: 0, t: 9 },
      params: {
        copyTo: { object: 'outputDoc' },
        description: 'Payer Party Identification'
      }
    },
    {
      id: 'edi-10',
      type: 'Arithmetic',
      label: 'RPN: Count N1 (+1)',
      coord: { x: 1, y: 10, z: 0, t: 10 },
      params: { targetObject: 'calculator', arithmeticOp: '+', arithmeticValue: 1 }
    },
    {
      id: 'edi-11',
      type: 'Copy',
      label: 'Emit RMR*IV*INV-2001-9041**145250.00~',
      coord: { x: 2, y: 11, z: 0, t: 11 },
      params: {
        copyTo: { object: 'outputDoc' },
        description: 'Remittance details for invoice'
      }
    },
    {
      id: 'edi-12',
      type: 'Arithmetic',
      label: 'RPN: Count RMR (+1) + SE (+1)',
      coord: { x: 1, y: 12, z: 0, t: 12 },
      params: { targetObject: 'calculator', arithmeticOp: '+', arithmeticValue: 2 }
    },
    {
      id: 'edi-13',
      type: 'Copy',
      label: 'Emit SE Trailer with RPN Count',
      coord: { x: 2, y: 13, z: 0, t: 13 },
      params: {
        copyFrom: { object: 'calculator', field: 'top' },
        copyTo: { object: 'outputDoc' },
        description: 'Format SE*<COUNT>*0001~'
      }
    },
    {
      id: 'edi-14',
      type: 'Ack',
      label: 'Generate EDI 997 Functional Ack',
      coord: { x: 2, y: 14, z: 0, t: 14 },
      params: {
        targetObject: 'outputDoc',
        description: 'Produces EDI Acknowledgement as detailed in Carlson paper Page 5'
      }
    }
  ]
};

/**
 * XML Depth-First Outline Traversal
 * As described on page 5-6 & 8:
 * "depth-first tree traversal of an XML document...
 * outline format in a window. The user can traverse the document using the arrow keys
 * and copy the current type, name, value, and status... OK or End"
 */
export const xmlTraversalPreset: ProgramBlueprint = {
  id: 'xml-dfs-traversal',
  name: 'XML / EDI Outline Depth-First Traversal',
  description: 'Hierarchical outline form traversal using Type, Name, Value, and Status ("OK" vs "End"). Extracts deep XML nodes, applies string trimming/justification, and constructs normalized output records.',
  paperReference: 'Page 5-6, "XML parser in outline format in a window"',
  initialInputText: `<MilitaryPurchaseOrder id="PO-4092">
  <Header>
    <DepotCode>WPAFB-OHIO</DepotCode>
    <Priority>RUSH-DEFENSE</Priority>
    <OrderDate>2001-10-14</OrderDate>
  </Header>
  <LineItem num="1">
    <PartNumber>NSN-5965-01-443</PartNumber>
    <Quantity>48</Quantity>
    <UnitPrice>1250.00</UnitPrice>
  </LineItem>
  <LineItem num="2">
    <PartNumber>NSN-2920-00-119</PartNumber>
    <Quantity>12</Quantity>
    <UnitPrice>850.50</UnitPrice>
  </LineItem>
</MilitaryPurchaseOrder>`,
  initialForm: {
    id: 'root',
    type: 'ELEMENT',
    name: 'MilitaryPurchaseOrder',
    value: 'id="PO-4092"',
    status: 'OK',
    children: [
      {
        id: 'header',
        type: 'ELEMENT',
        name: 'Header',
        value: '',
        status: 'OK',
        children: [
          { id: 'depot', type: 'FIELD', name: 'DepotCode', value: 'WPAFB-OHIO', status: 'OK' },
          { id: 'prio', type: 'FIELD', name: 'Priority', value: 'RUSH-DEFENSE', status: 'OK' },
          { id: 'date', type: 'FIELD', name: 'OrderDate', value: '2001-10-14', status: 'OK' }
        ]
      },
      {
        id: 'item1',
        type: 'ELEMENT',
        name: 'LineItem',
        value: 'num="1"',
        status: 'OK',
        children: [
          { id: 'part1', type: 'FIELD', name: 'PartNumber', value: 'NSN-5965-01-443', status: 'OK' },
          { id: 'qty1', type: 'FIELD', name: 'Quantity', value: '48', status: 'OK' },
          { id: 'price1', type: 'FIELD', name: 'UnitPrice', value: '1250.00', status: 'OK' }
        ]
      },
      {
        id: 'item2',
        type: 'ELEMENT',
        name: 'LineItem',
        value: 'num="2"',
        status: 'OK',
        children: [
          { id: 'part2', type: 'FIELD', name: 'PartNumber', value: 'NSN-2920-00-119', status: 'OK' },
          { id: 'qty2', type: 'FIELD', name: 'Quantity', value: '12', status: 'OK' },
          { id: 'price2', type: 'FIELD', name: 'UnitPrice', value: '850.50', status: 'End' }
        ]
      }
    ]
  },
  operations: [
    {
      id: 'xml-0',
      type: 'Create/Show',
      label: 'Show Outline Form',
      coord: { x: -1, y: 0, z: 0, t: 0 },
      params: { targetObject: 'form', description: 'Mount XML tree outline viewer' }
    },
    {
      id: 'xml-1',
      type: 'Create/Show',
      label: 'Show String Calculator',
      coord: { x: 1, y: 1, z: 0, t: 1 },
      params: { targetObject: 'stringCalculator', description: 'Field formatting & padding' }
    },
    {
      id: 'xml-2',
      type: 'Copy',
      label: 'Copy Form[DepotCode] -> StringCalc',
      coord: { x: -1, y: 2, z: 1, t: 2 },
      params: {
        copyFrom: { object: 'form', field: 'depot' },
        copyTo: { object: 'stringCalculator' }
      }
    },
    {
      id: 'xml-3',
      type: 'Justify',
      label: 'Justify DepotCode Left [Width 15]',
      coord: { x: 1, y: 3, z: 1, t: 3 },
      params: {
        targetObject: 'stringCalculator',
        justifyType: 'left',
        targetWidth: 15,
        paddingChar: ' '
      }
    },
    {
      id: 'xml-4',
      type: 'Copy',
      label: 'Emit Formatted Depot to Output',
      coord: { x: 2, y: 4, z: 1, t: 4 },
      params: {
        copyFrom: { object: 'stringCalculator' },
        copyTo: { object: 'outputDoc' }
      }
    },
    {
      id: 'xml-5',
      type: 'Extend',
      label: 'Form: Select Next Node (Arrow Down)',
      coord: { x: -1, y: 5, z: 2, t: 5 },
      params: {
        targetObject: 'form',
        description: 'Navigate deeper into LineItem nodes'
      }
    },
    {
      id: 'xml-6',
      type: 'Copy',
      label: 'Copy PartNumber & UnitPrice -> Output',
      coord: { x: 2, y: 6, z: 2, t: 6 },
      params: {
        copyFrom: { object: 'form' },
        copyTo: { object: 'outputDoc' }
      }
    }
  ]
};

export const allPresets: ProgramBlueprint[] = [
  figure1Preset,
  edi820Preset,
  xmlTraversalPreset
];
