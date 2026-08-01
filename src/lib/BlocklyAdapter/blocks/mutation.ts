import * as Blockly from 'blockly/core';

import plusImage from '../../../assets/blocks/add.svg';
import minusImage from '../../../assets/blocks/minus.svg';

export interface SavedMutationConnection {
    shadow: Blockly.serialization.blocks.State | null;
    block: Blockly.Block | null;
}

interface MutationBlock extends Blockly.Block {
    saveExtraState?: () => unknown;
}

/**
 * 保存动态输入中的 shadow 与普通积木，并在重建输入后恢复它们。
 */
export class MutationConnectionStore {
    private connections = new Map<string, SavedMutationConnection>();

    capture(block: Blockly.Block, inputNames: Iterable<string>): void {
        const next = new Map<string, SavedMutationConnection>();
        for (const inputName of inputNames) {
            const connection = block.getInput(inputName)?.connection;
            if (!connection) continue;
            const target = connection.targetBlock();
            next.set(inputName, {
                shadow: connection.getShadowState(true),
                block: target && !target.isShadow() ? target : null,
            });
        }
        this.connections = next;
    }

    restore(
        block: Blockly.Block,
        inputName: string,
        defaultShadow: Blockly.serialization.blocks.State | null = null,
    ): void {
        const connection = block.getInput(inputName)?.connection;
        if (!connection) return;

        const saved = this.connections.get(inputName);
        const shadow = saved?.shadow ?? defaultShadow;
        if (shadow) connection.setShadowState(shadow);

        const blockConnection = saved?.block?.outputConnection ?? saved?.block?.previousConnection;
        if (blockConnection && !blockConnection.isConnected()) {
            connection.connect(blockConnection);
        }
    }

    get(inputName: string): SavedMutationConnection | undefined {
        return this.connections.get(inputName);
    }

    set(inputName: string, saved: SavedMutationConnection): void {
        this.connections.set(inputName, saved);
    }

    delete(inputName: string): void {
        this.connections.delete(inputName);
    }

    /** 删除一组索引输入，并把后续项连续前移。 */
    removeIndex(count: number, removeIndex: number, getInputNames: (index: number) => string[]) {
        const next = new Map<string, SavedMutationConnection>();
        for (let oldIndex = 0, newIndex = 0; oldIndex < count; oldIndex++) {
            if (oldIndex === removeIndex) continue;
            const oldNames = getInputNames(oldIndex);
            const newNames = getInputNames(newIndex);
            for (let i = 0; i < oldNames.length; i++) {
                const saved = this.connections.get(oldNames[i]);
                if (saved) next.set(newNames[i], saved);
            }
            newIndex++;
        }
        this.connections = next;
    }

    clear(): void {
        this.connections.clear();
    }
}

/** 安全移除动态输入，避免遍历 inputList 时原地修改。 */
export function removeMutationInputs(
    block: Blockly.Block,
    shouldRemove: (input: Blockly.Input) => boolean,
): void {
    for (const input of [...block.inputList]) {
        if (shouldRemove(input)) block.removeInput(input.name);
    }
}

export function createPlusField(args?: unknown): Blockly.FieldImage {
    return createMutationButton(plusImage, block => {
        (block as unknown as { plus: (args?: unknown) => void }).plus(args);
    });
}

export function createMinusField(args: { removeIndex: number }): Blockly.FieldImage {
    return createMutationButton(minusImage, block => {
        (block as unknown as { minus: (index: number) => void }).minus(args.removeIndex);
    });
}

/**
 * 创建会产生 mutation 撤销事件的按钮。
 * FieldImage 回调位于 Blockly 的 pointerup 手势中，结构更新必须延后执行。
 */
function createMutationButton(
    image: string,
    mutate: (block: MutationBlock) => void,
): Blockly.FieldImage {
    return new Blockly.FieldImage(image, 15, 15, undefined, field => {
        const block = field.getSourceBlock();
        if (!block || block.isInFlyout) return;

        queueMicrotask(() => {
            if (block.isDeadOrDying()) return;
            const oldState = serializeMutation(block);

            Blockly.Events.setGroup(true);
            try {
                mutate(block);
                const newState = serializeMutation(block);
                if (oldState !== newState) {
                    Blockly.Events.fire(
                        new Blockly.Events.BlockChange(block, 'mutation', null, oldState, newState),
                    );
                }
            } finally {
                Blockly.Events.setGroup(false);
            }
        });
    });
}

function serializeMutation(block: MutationBlock): string {
    const state = block.saveExtraState?.();
    return state ? JSON.stringify(state) : '';
}
