import { Blockly } from '..';

import AddIcon from './blocks/assets/add.svg';
import MinusIcon from './blocks/assets/minus.svg';

/**
 * 通过单次长度决定积木的快捷变异器
 *
 * ## 怎么使用
 * ``` ts
 * init() {
 *      ...;
 *      this.X = new MutateByLength(this, () => {...}, 1);
 * },
 * updateShape() {
 *      this.X.updateShape();
 * },
 * saveExtraState() {
 *      return this.X.saveExtraState()
 * },
 * loadExtraState(state: { length: number }) {
 *      this.X.loadExtraState(state);
 *      this.updateShape();
 * }
 * ```
 */
export class MutateByLength<const prefix extends string, const tipPrefix extends string> {
    private Block: Blockly.Block | undefined;
    /** 添加输入框所作的行为 */
    protected onAddInput: (
        input: Blockly.Input,
        prefix: prefix | tipPrefix,
        isInit: boolean,
        length: number,
    ) => void;
    /** 当前输入框的项数 */
    protected length: number;
    protected default_length: number;
    /** 输入框前缀 */
    protected readonly inputPrefix: prefix;
    /** 输入框提示前缀 */
    protected readonly inputTipPrefix: tipPrefix;

    constructor(
        Block: Blockly.Block,
        /** 添加输入框所作的行为 */
        onAddInput: (
            input: Blockly.Input,
            prefix: prefix | tipPrefix,
            isInit: boolean,
            length: number,
        ) => void,
        /** 用在输入框前缀，例如`input_` */
        inputPrefix: prefix,
        /** 每个输入框的提示ID */
        inputTipPrefix: tipPrefix,
        /** 初始的长度，默认为1 */
        initialLength?: number,
    ) {
        this.Block = Block;
        this.onAddInput = onAddInput;
        this.inputPrefix = inputPrefix;
        this.inputTipPrefix = inputTipPrefix;
        this.default_length = initialLength ?? 1;
        this.length = this.default_length;
    }

    updateShape() {
        if (!this.Block) return;
        let i = this.length;
        while (
            this.Block.getInput(`${this.inputPrefix}${String(i)}`) ||
            this.Block.getInput(`${this.inputTipPrefix}${String(i + 1)}`)
        ) {
            this.Block.removeInput(`${this.inputTipPrefix}${String(i)}`, true);
            this.Block.removeInput(`${this.inputPrefix}${String(i + 1)}`, true);
            i++;
        }

        for (let i = 0; i <= this.length; i += 1) {
            const input = this.Block.getInput(`${this.inputPrefix}${String(i)}`);
            this.onAddInput(
                input ?? this.Block.appendValueInput(`${this.inputPrefix}${String(i)}`),
                this.inputPrefix,
                !input,
                i,
            );

            if (i !== this.length) {
                const tipInput = this.Block.getInput(`${this.inputTipPrefix}${String(i)}`);
                this.onAddInput(
                    tipInput ?? this.Block.appendDummyInput(`${this.inputTipPrefix}${String(i)}`),
                    this.inputTipPrefix,
                    !tipInput,
                    i,
                );
            }
        }

        this.Block.removeInput('changeItemButton', true);

        const changeItemButton = this.Block.appendDummyInput('changeItemButton');
        if (this.length - 1 >= this.default_length)
            changeItemButton.appendField(
                new Blockly.FieldImage(MinusIcon, 20, 20, undefined, () => {
                    if (!this.Block) return;
                    this.length -= 1;
                    this.Block.workspace.fireChangeListener(
                        new Blockly.Events.BlockChange(
                            this.Block,
                            'mutation',
                            null,
                            JSON.stringify({ length: this.length + 1 }),
                            JSON.stringify({ length: this.length }),
                        ),
                    );
                    this.updateShape();
                }),
            );
        changeItemButton.appendField(
            new Blockly.FieldImage(AddIcon, 20, 20, undefined, () => {
                if (!this.Block) return;
                this.length += 1;
                this.Block.workspace.fireChangeListener(
                    new Blockly.Events.BlockChange(
                        this.Block,
                        'mutation',
                        null,
                        JSON.stringify({ length: this.length - 1 }),
                        JSON.stringify({ length: this.length }),
                    ),
                );
                this.updateShape();
            }),
        );
    }
    saveExtraState() {
        return {
            length: this.length,
        };
    }
    loadExtraState(state: { length: number }) {
        this.length = state.length;
    }

    getLength() {
        return this.length;
    }

    getValueInputs(): Blockly.Input[] {
        if (!this.Block) throw new Error(`Can't find Block`);
        const result: Blockly.Input[] = [];
        for (let i = 0; i <= this.length; i += 1) {
            const input = this.Block.getInput(`${this.inputPrefix}${String(i)}`);
            if (input) result.push(input);
        }
        return result;
    }
}
