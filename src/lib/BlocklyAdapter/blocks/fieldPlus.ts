// 本函数由Ai编写

import * as Blockly from 'blockly/core';

const plusImage =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAw' +
    'MC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPSJNMT' +
    'ggMTBoLTR2LTRjMC0xLjEwNC0uODk2LTItMi0ycy0yIC44OTYtMiAybC4wNzEgNGgtNC4wNz' +
    'FjLTEuMTA0IDAtMiAuODk2LTIgMnMuODk2IDIgMiAybDQuMDcxLS4wNzEtLjA3MSA0LjA3MW' +
    'MwIDEuMTA0Ljg5NiAyIDIgMnMyLS44OTYgMi0ydi00LjA3MWw0IC4wNzFjMS4xMDQgMCAyLS' +
    '44OTYgMi0ycy0uODk2LTItMi0yeiIgZmlsbD0id2hpdGUiIC8+PC9zdmc+Cg==';

export function createPlusField(args?: unknown): Blockly.FieldImage {
    const plus = new Blockly.FieldImage(plusImage, 15, 15, undefined, onClick_);
    (plus as Blockly.FieldImage & { args_: unknown }).args_ = args;
    return plus;
}

function onClick_(plusField: Blockly.FieldImage): void {
    const block = plusField.getSourceBlock();
    if (!block) return;
    if (block.isInFlyout) return;

    Blockly.Events.setGroup(true);
    const oldExtraState = getExtraBlockState(block);
    (block as unknown as { plus: (args?: unknown) => void }).plus(
        (plusField as Blockly.FieldImage & { args_: unknown }).args_,
    );
    const newExtraState = getExtraBlockState(block);

    if (oldExtraState !== newExtraState) {
        Blockly.Events.fire(
            new Blockly.Events.BlockChange(block, 'mutation', null, oldExtraState, newExtraState),
        );
    }
    Blockly.Events.setGroup(false);
}

function getExtraBlockState(blockDefintion: Blockly.Block): string {
    const block = blockDefintion as Blockly.Block & {
        saveExtraState?: () => unknown;
        mutationToDom?: () => Element;
    };
    if (!block.saveExtraState) return '';
    const state = block.saveExtraState() as unknown;
    return state ? JSON.stringify(state) : '';
}
