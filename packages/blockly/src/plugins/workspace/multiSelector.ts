import * as Blockly from 'blockly';
import { registerMultiSelectShortcuts } from './shortcutsReg';

export class WorkspaceMultiSelectorManager {
    static readonly CLASS_NAME = 'ashBlock-multi-selected';

    protected workspaceSVG: Blockly.WorkspaceSvg;
    protected id: string;
    private selections: {
        id: string;
        blockSvg: Blockly.BlockSvg;
        highlightPath: {
            pathObject: Blockly.blockRendering.IPathObject;
            observer: MutationObserver;
        };
    }[];
    /** 是否在触发单选时取消选择 */
    private ignoreUnselect = false;

    constructor(workspaceSVG: Blockly.WorkspaceSvg, id: string) {
        this.workspaceSVG = workspaceSVG;
        this.id = id;
        this.selections = [];
    }

    private createPathObject(
        block: Blockly.BlockSvg,
    ): (typeof this.selections)[number]['highlightPath'] {
        const pathObject = this.workspaceSVG
            .getRenderer()
            .makePathObject(block.getSvgRoot(), block.style);
        pathObject.applyColour?.(block);
        pathObject.updateMovable(block.isMovable() || block.isInFlyout);

        const realPath = block
            .getSvgRoot()
            .getElementsByClassName('blocklyPath')[0] as SVGPathElement;

        const update = () => pathObject.setPath(realPath.getAttribute('d') ?? '');
        update();

        const observer = new MutationObserver(update);
        observer.observe(realPath, { attributes: true, attributeFilter: ['d', 'transform'] });

        pathObject.svgPath.classList.add('ashBlocklyPathSelected');
        pathObject.updateSelected(true);

        return { pathObject, observer };
    }

    setIgnoreUnselect(isIgnoreUnselect: boolean): void {
        this.ignoreUnselect = isIgnoreUnselect;
    }
    getIsIgnoreUnselect(): boolean {
        return this.ignoreUnselect;
    }

    selectBlock(block: Blockly.BlockSvg, selectBlock = true) {
        if (!this.workspaceSVG.getBlockById(block.id)) return;
        if (this.isSelected(block)) return;
        if (selectBlock) Blockly.getFocusManager().focusNode(block);
        this.selections.push({
            id: block.id,
            blockSvg: block,
            highlightPath: this.createPathObject(block),
        });
    }

    unselectBlock(block: Blockly.BlockSvg): boolean {
        let result = false;
        this.selections = this.selections.filter(selection => {
            if (selection.id !== block.id) return true;
            result = true;
            selection.highlightPath.observer.disconnect();
            selection.highlightPath.pathObject.updateSelected(false);
            selection.highlightPath.pathObject.svgPath?.remove();
            return false;
        });
        return result;
    }

    unselectAll() {
        this.selections.forEach(selection => {
            this.unselectBlock(selection.blockSvg);
        });
        this.selections = [];
    }

    /** 用Blockly的选中最后一个选中的积木 */
    focusLastBlock() {
        const lastBlock = this.getSelectedBlocks().at(-1)?.blockSvg;
        if (lastBlock) Blockly.getFocusManager().focusNode(lastBlock);
    }

    isSelected(block: Blockly.BlockSvg): boolean {
        return !!this.selections.find(selection => selection.blockSvg === block);
    }

    getSelectedBlocks(): typeof this.selections {
        return this.selections;
    }
}

class AshMultiSelectorManager {
    private workspaces: Map<string, WorkspaceMultiSelectorManager>;
    constructor() {
        this.workspaces = new Map();
        registerMultiSelectShortcuts();
    }

    registerWorkspace(workspaceSVG: Blockly.WorkspaceSvg, id?: string): string {
        if (this.workspaces.has(id ?? '')) throw new Error(`Workspace ${id} is already exist.`);
        const resultID = id ?? crypto.randomUUID();
        this.workspaces.set(resultID, new WorkspaceMultiSelectorManager(workspaceSVG, resultID));
        return resultID;
    }

    getWorkspace(id: string): WorkspaceMultiSelectorManager | undefined {
        return this.workspaces.get(id);
    }

    removeWorkspace(id: string): boolean {
        return this.workspaces.delete(id);
    }
}

export const ashMultiSelectorManager = new AshMultiSelectorManager();
