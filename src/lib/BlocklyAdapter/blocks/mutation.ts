/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';

import plusImage from '../../../assets/blocks/add.svg';
import minusImage from '../../../assets/blocks/minus.svg';
import settingsImage from '../../../assets/settingsFunction.svg';

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

// 此函数由AI生成
/**
 * 把结构变更与起因事件同组记录为 mutation，保证可撤销。
 * FieldImage 回调位于 Blockly 的 pointerup 手势中，调用方需自行延后执行。
 */
export function runWithMutationUndo(block: MutationBlock, mutate: () => void): void {
    queueMicrotask(() => {
        if (block.isDeadOrDying()) return;
        const oldState = serializeMutation(block);

        Blockly.Events.setGroup(true);
        try {
            mutate();
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
}

export function createMinusField(args: { removeIndex: number }): Blockly.FieldImage {
    return createMutationButton(minusImage, block => {
        (block as unknown as { minus: (index: number) => void }).minus(args.removeIndex);
    });
}

/**
 * 按稳定 key 删除的减号按钮。
 *
 * 索引版（{@link createMinusField}）在删中间项后会让后续项编号左移，
 * 依赖 input 名称认亲的积木（如函数参数）不能用索引，必须用不变的 key。
 */
export function createMinusFieldByKey(args: { removeKey: string }): Blockly.FieldImage {
    return createMutationButton(minusImage, block => {
        (block as unknown as { minusByKey: (key: string) => void }).minusByKey(args.removeKey);
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
        runWithMutationUndo(block, () => {
            mutate(block);
        });
    });
}

// 此类由AI生成
/**
 * 竖向堆叠的双图标按钮：上图、下图纵向排列，节省横向空间。
 *
 * 顶部图标走 Blockly 原生 clickHandler 手势管道；底部图标直接在
 * image 元素上挂 pointerdown（stopPropagation 避开 Blockly 手势）。
 * 不调用父类 initView：它只渲染一张图，且会拉伸到整个 field 高度。
 * 父类的 altText / clickHandler 是私有的，顶部配置自存一份。
 */
export class FieldStackedIcons extends Blockly.FieldImage {
    private readonly bottom: {
        src: string;
        alt: string;
        onClick: (block: MutationBlock) => void;
    };
    private readonly topAlt: string;
    private readonly iconSize: number;
    private bottomImage: SVGImageElement | null = null;

    constructor(
        top: { src: string; alt: string; onClick: (block: MutationBlock) => void },
        bottom: { src: string; alt: string; onClick: (block: MutationBlock) => void },
        iconSize = 15,
    ) {
        // 高度 = 两枚图标 + FieldImage 的 1px 底部留白。
        super(top.src, iconSize, iconSize * 2 + 1, top.alt, field => {
            const block = field.getSourceBlock();
            if (block) {
                top.onClick(block);
            }
        });
        this.bottom = bottom;
        this.topAlt = top.alt;
        this.iconSize = iconSize;
    }

    override initView() {
        const group = this.fieldGroup_;
        if (!group) return;

        this.imageElement = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE,
            {
                height: `${String(this.iconSize)}px`,
                width: `${String(this.size_.width)}px`,
                alt: this.topAlt,
                style: 'cursor: pointer;',
            },
            group,
        );
        this.imageElement.setAttributeNS(
            Blockly.utils.dom.XLINK_NS,
            'xlink:href',
            this.value_ ?? '',
        );
        Blockly.utils.dom.addClass(group, 'blocklyImageField');
        // 样式表按 g.blocklyImageField[role='button'] 命中按钮芯片样式
        // （padding + 圆角描边 + hover）。普通 FieldImage 的 role 由
        // doValueUpdate_ → recomputeAriaContext 在后续 setValue 时补挂，
        // 本类初始化后不再 setValue，必须自己补上。
        group.setAttribute('role', 'button');

        this.bottomImage = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE,
            {
                y: `${String(this.iconSize)}px`,
                height: `${String(this.iconSize)}px`,
                width: `${String(this.size_.width)}px`,
                alt: this.bottom.alt,
                style: 'cursor: pointer;',
            },
            group,
        );
        this.bottomImage.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href', this.bottom.src);
        // 直接挂元素级监听并截断冒泡：既绕开 Blockly 手势（否则整块
        // 会被当成 field 点击），又保证齿轮在拖拽手势里点得准。
        this.bottomImage.addEventListener('pointerdown', (event: PointerEvent) => {
            event.stopPropagation();
            event.preventDefault();
            const block = this.getSourceBlock();
            if (!block || block.isInFlyout || block.isDeadOrDying()) return;
            this.bottom.onClick(block);
        });
    }
}

// 此函数由AI生成
/**
 * 参数的竖向按钮组：上「−」删除参数，下「⚙」设置参数类型。
 */
export function createMinusWithSettingsField(args: { key: string }): Blockly.FieldImage {
    return new FieldStackedIcons(
        {
            src: minusImage,
            alt: t('blocks:function.removeParam'),
            onClick: block => {
                runWithMutationUndo(block, () => {
                    (block as unknown as { minusByKey: (key: string) => void }).minusByKey(
                        args.key,
                    );
                });
            },
        },
        {
            src: settingsImage,
            alt: t('blocks:function.paramType'),
            onClick: block => {
                // 弹窗是异步的：退出 pointer 手势后再打开。
                queueMicrotask(() => {
                    (
                        block as unknown as { openParamSettings: (key: string) => void }
                    ).openParamSettings(args.key);
                });
            },
        },
    );
}

function serializeMutation(block: MutationBlock): string {
    const state = block.saveExtraState?.();
    return state ? JSON.stringify(state) : '';
}
