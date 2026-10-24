import { Blockly, type TOPCODES_VALUE } from '..';

/**
 * 对于链接积木的配置项
 */
export const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 帽子积木配置项
 */
export const hatConnections = {
    nextStatement: 'Action',
    inputsInline: true,
    hat: 'cap',
} as const;

/**
 * 结束积木配置项
 */
export const endConnections = {
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 匹配分支只能连接到匹配积木内部。
 */
export const matchBranchConnections = {
    previousStatement: 'MatchBranch',
    nextStatement: 'MatchBranch',
    inputsInline: true,
} as const;

/**
 * 默认分支必须位于匹配分支栈末尾。
 */
export const matchBranchEndConnections = {
    previousStatement: 'MatchBranch',
    inputsInline: true,
} as const;

/**
 * 对于返回值
 */
export const returnConnections = {
    inputsInline: true,
} as const;

/**
 * 积木的值类型。
 *
 * 只有这些是基础类型，其余类型（AssetHandle、`[number, number]` 等）都由它们组合而成，
 * 目前不做。
 *
 * @author AI
 */
export const TYPES = {
    NUMBER: 'Number',
    STRING: 'String',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    ARRAY: 'Array',
    /** 也就是 any */
    UNKNOWN: null,
    FUNCTION: 'Function',
} as const;

type TTYPES = (typeof TYPES)[keyof typeof TYPES];

/**
 * `input_value` 参数的简写。
 *
 * @author AI
 */
const valueInput = (name: string, check?: TTYPES) => ({ type: 'input_value', name, check });

export const numberInput = (name: string) => valueInput(name, TYPES.NUMBER);
export const stringInput = (name: string) => valueInput(name, TYPES.STRING);
export const booleanInput = (name: string) => valueInput(name, TYPES.BOOLEAN);
export const objectInput = (name: string) => valueInput(name, TYPES.OBJECT);
export const arrayInput = (name: string) => valueInput(name, TYPES.ARRAY);
export const functionInput = (name: string) => valueInput(name, TYPES.FUNCTION);
export const unknownInput = (name: string) => valueInput(name, TYPES.UNKNOWN);

/**
 * `input_statement` 参数的简写。
 *
 * @author AI
 */
export const statementInput = (name: string, check = 'Action') => ({
    type: 'input_statement',
    name,
    check,
});

/**
 * 空槽，暂时只显示一个空位，之后会换成真正的积木。
 *
 * @author AI
 */
export const emptySlot = (name: string) => ({ type: 'field_label', name, text: ' ' });

/**
 * `field_dropdown` 参数的简写。
 *
 * @author AI
 */
export const dropdown = (name: string, options: string[][]) => ({
    type: 'field_dropdown',
    name,
    options,
});

export class BlockIcon extends Blockly.icons.Icon {
    protected iconSource: string | undefined;
    private size = 26;
    constructor(sourceBlock: Blockly.Block, iconSource: string) {
        super(sourceBlock);
        this.iconSource = iconSource;
    }

    getType(): Blockly.icons.IconType<Blockly.IIcon> {
        return new Blockly.icons.IconType('BLOCK_ICON');
    }

    getWeight(): number {
        return 0;
    }

    getSize(): Blockly.utils.Size {
        return new Blockly.utils.Size(this.size + 15, this.size);
    }

    initView(pointerdownListener: (e: PointerEvent) => void): void {
        if (this.svgRoot || !this.iconSource) return;
        super.initView(pointerdownListener);
        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE,
            {
                class: 'block-icon',
                width: this.size,
                height: this.size,
                href: this.iconSource,
            },
            this.svgRoot,
        );
        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.LINE,
            {
                class: 'block-icon-split',
                x1: this.size + 10,
                x2: this.size + 10,
                y1: 0,
                y2: this.size,
                // 为保证 getColourSecondary 可能不存在的时候不会报错，加了个null类型，来骗，来偷袭ts
                // TODO: `?? '#00000055'` 是否有必要
                stroke:
                    (this.getSourceBlock() as Blockly.BlockSvg | null)?.getColourSecondary() ??
                    '#00000055',
                style: 'stroke-linecap: round;stroke-width: 2',
            },
            this.svgRoot,
        );

        Blockly.utils.dom.addClass(this.svgRoot!, 'block-icon');
    }

    setOffsetInBlock(offset: Blockly.utils.Coordinate): void {
        this.offsetInBlock = offset;
        this.svgRoot?.setAttribute(
            'transform',
            // 保证视觉对齐
            `translate(${String(this.offsetInBlock.x + 2)}, ${String(this.offsetInBlock.y + 2)})`,
        );
    }
}

interface FieldImageTextFromJsonConfig extends Blockly.FieldImageFromJsonConfig {
    text?: string;
}

interface FieldImageTextConfig extends Blockly.FieldImageConfig {
    showClickableBorder?: boolean;
}

export class FieldImageText extends Blockly.FieldImage {
    protected text: string | null;
    private static readonly TEXT_PADDING = 4;
    private showClickableBorder = true;

    protected textElement: SVGTextElement | null = null;

    constructor(
        src: string | typeof Blockly.Field.SKIP_SETUP,
        width: string | number,
        height: string | number,
        text: string | null,
        alt?: string,
        onClick?: (p1: Blockly.FieldImage) => void,
        flipRtl?: boolean,
        config?: FieldImageTextConfig,
    ) {
        super(src, width, height, alt, onClick, flipRtl, config);
        this.showClickableBorder = config?.showClickableBorder ?? true;
        this.text = text;
    }

    override initView() {
        super.initView();
        this.textElement = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.TEXT,
            {
                class: 'blocklyText',
                'dominant-baseline': 'middle',
                style: 'cursor:pointer',
            },
            this.fieldGroup_,
        );
        this.textElement.textContent = this.text;
        this.isDirty_ = true;
    }

    override recomputeAriaContext(): boolean {
        const shouldCustomize = super.recomputeAriaContext();
        if (!shouldCustomize) return false;

        const focusableElement = this.getFocusableElement();

        if (this.isClickable() && this.showClickableBorder) {
            const label = this.getAriaValue() ?? '';
            Blockly.utils.aria.setState(focusableElement, Blockly.utils.aria.State.LABEL, label);
            return true;
        }
        Blockly.utils.aria.setRole(focusableElement, Blockly.utils.aria.Role.NONE);
        Blockly.utils.aria.clearState(focusableElement, Blockly.utils.aria.State.LABEL);
        return false;
    }

    override updateSize_() {
        if (!this.imageElement || !this.textElement) return;

        const imageWidth = parseFloat(this.imageElement.getAttribute('width') ?? '0');
        const imageHeight = this.imageHeight;

        let textWidth = 0;
        if (this.text) textWidth = Blockly.utils.dom.getTextWidth(this.textElement);

        const padding = this.text ? FieldImageText.TEXT_PADDING : 0;

        this.size_ = new Blockly.utils.Size(imageWidth + textWidth + padding, imageHeight + 1);

        this.textElement.setAttribute('x', String(imageWidth + padding));
        this.textElement.setAttribute('y', String(imageHeight / 2 + 2.6));
    }

    setText(text: string | null) {
        const newText = text ? Blockly.utils.parsing.replaceMessageReferences(text) : '';
        if (newText === this.text) return;
        this.text = newText;
        if (this.textElement) {
            this.textElement.textContent = this.text;
            this.isDirty_ = true;
            this.forceRerender();
        }
    }

    protected override getText_(): string | null {
        return this.text ?? super.getText_();
    }

    override getAriaValue(): string | null {
        const alt = super.getAriaValue();
        if (this.text && alt) return `${this.text} ${alt}`;
        return this.text ?? alt;
    }

    static override fromJson(options: FieldImageTextFromJsonConfig): FieldImageText {
        if (!options.src || !options.width || !options.height) {
            throw new Error('src, width, and height values for an image field are required.');
        }
        return new this(
            options.src,
            options.width,
            options.height,
            options.text ?? '',
            undefined,
            undefined,
            undefined,
            options,
        );
    }
}

export class DraggableParamBlock {
    block: Blockly.Block;
    inputID: string;
    blockType: TOPCODES_VALUE;
    /** 块类型 */
    type: string | string[] | null;

    private innerBlockID: string | undefined;

    onchange(event: Blockly.Events.Abstract) {
        if (event.type !== 'drag') return;
        const dragEvent = event as unknown as Blockly.Events.BlockDrag;
        if (!dragEvent.blockId) return;
        const dragBlock = this.block.workspace.getBlockById(dragEvent.blockId);
        if (!dragBlock) return;
        if (dragBlock.type === this.blockType) {
            const dragCurrentBlock = dragBlock as Blockly.Block & {
                name?: string;
                parentID?: string;
            };
            if (dragCurrentBlock.parentID !== this.block.id) return;
            // 重新加入积木
            this.updateValueBlock();
        }
    }

    updateValueBlock() {
        const input = this.block.getInput(this.inputID);
        if (!input?.connection) return;
        if (input.connection.isConnected()) return;
        input.setCheck(this.type);
        const valueBlock = this.block.workspace.newBlock(this.blockType) as Blockly.BlockSvg;
        if (!valueBlock.outputConnection || !valueBlock.loadExtraState) throw new Error(`Can't add block to workspace`);
        valueBlock.loadExtraState({
            parentID: this.block.id,
        });
        valueBlock.initSvg();
        valueBlock.render();
        input.connection.connect(valueBlock.outputConnection);
        this.innerBlockID = valueBlock.id;
    }

    loadExtraState(blockID: string) {
        this.block.getInput(this.inputID)?.connection?.targetBlock()?.dispose();
        this.innerBlockID = blockID;
    }

    getInnerBlockID(): string | undefined {
        return this.innerBlockID;
    }

    /**
     * 配置一个可无限拖出的输入框
     * @param block 期望加入可无限拖出积木的实例
     * @param inputID 输入框的ID
     * @param blockType 其中无限拖出积木的OPCODE
     * @param type 它的类型，不确定为null
     */
    constructor(
        block: Blockly.Block,
        inputID: string,
        blockType: TOPCODES_VALUE,
        type: string | string[] | null,
    ) {
        this.block = block;
        this.inputID = inputID;
        this.blockType = blockType;
        this.type = type;
    }
}

export { type TTYPES };
