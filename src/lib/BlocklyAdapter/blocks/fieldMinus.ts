// 本函数由Ai编写

import * as Blockly from 'blockly/core';

const minusImage =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAw' +
    'MC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPS' +
    'JNMTggMTFoLTEyYy0xLjEwNCAwLTIgLjg5Ni0yIDJzLjg5NiAyIDIgMmgxMmMxLjEwNCAw' +
    'IDItLjg5NiAyLTJzLS44OTYtMi0yLTJ6IiBmaWxsPSJ3aGl0ZSIgLz48L3N2Zz4K';

export function createMinusField(args?: { removeIndex: number }): Blockly.FieldImage {
    const minus = new Blockly.FieldImage(
        minusImage,
        15,
        15,
        undefined,
        (minusField, removeIndex = args?.removeIndex ?? 0) => {
            onClick_(minusField, removeIndex);
        },
    );
    (minus as Blockly.FieldImage & { args_: unknown }).args_ = args;
    return minus;
}

function onClick_(minusField: Blockly.FieldImage, removeIndex = 0): void {
    const block = minusField.getSourceBlock();
    if (!block) return;
    if (block.isInFlyout) return;

    Blockly.Events.setGroup(true);
    const oldExtraState = getExtraBlockState(block);
    (block as unknown as { minus: (args?: unknown) => void }).minus(removeIndex);
    const newExtraState = getExtraBlockState(block);

    if (oldExtraState !== newExtraState) {
        Blockly.Events.fire(
            new Blockly.Events.BlockChange(block, 'mutation', null, oldExtraState, newExtraState),
        );
    }
    Blockly.Events.setGroup(false);
}

/**
 * 取得块的额外状态字符串（JSON 或 XML），用于前后对比以决定是否 fire 事件。
 * 改写自 serialization_helper.js
 */
function getExtraBlockState(blockDefintion: Blockly.Block): string {
    const block = blockDefintion as Blockly.Block & {
        saveExtraState?: () => unknown;
        mutationToDom?: () => Element;
    };
    if (!block.saveExtraState) return '';
    const state = block.saveExtraState() as unknown;
    return state ? JSON.stringify(state) : '';
}
