import * as Blockly from 'blockly';
import { registerMultiSelectShortcuts } from './shortcutsReg';

export class WorkspaceMultiSelectorManager {
    static readonly CLASS_NAME = 'ashBlock-multi-selected';

    protected workspaceSVG: Blockly.WorkspaceSvg;
    protected id: string;
    private selections: {
        id: string;
        blockSvg: Blockly.BlockSvg;
        highlightPath: Blockly.blockRendering.IPathObject;
    }[];
    /** 是否在触发单选时取消选择 */
    private ignoreUnselect = false;

    constructor(workspaceSVG: Blockly.WorkspaceSvg, id: string) {
        this.workspaceSVG = workspaceSVG;
        this.id = id;
        this.selections = [];
        this.workspaceSVG.addChangeListener(e => {
            if (e.type === 'selected' && !this.ignoreUnselect) {
                const focusedBlock = Blockly.getSelected();
                if (focusedBlock instanceof Blockly.BlockSvg && !this.isSelected(focusedBlock))
                    this.unselectAll();
            } else if (e.type === 'change' || e.type === 'create') {
                this.selections.forEach(selection => {
                    if (e instanceof Blockly.Events.BlockCreate && e.ids?.includes(selection.id))
                        selection.highlightPath.setPath(this.getBlockPath(selection.blockSvg));
                });
                console.log(e);
            }
        });
    }

    private getBlockPath(block: Blockly.BlockSvg): string {
        return (
            (
                block.getSvgRoot().getElementsByClassName('blocklyPath')[0] as SVGPathElement
            ).getAttribute('d') ?? ''
        );
    }

    private createPathObject(block: Blockly.BlockSvg): Blockly.blockRendering.IPathObject {
        const pathObject = this.workspaceSVG
            .getRenderer()
            .makePathObject(block.getSvgRoot(), block.style);
        pathObject.applyColour?.(block);
        pathObject.updateMovable(block.isMovable() || block.isInFlyout);
        pathObject.setPath(this.getBlockPath(block));
        pathObject.svgPath.classList.add('ashBlocklyPathSelected');
        pathObject.updateSelected(true);
        return pathObject;
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
            if (selection.id === block.id) {
                result = true;
                selection.highlightPath.updateSelected(false);
                selection.highlightPath.svgPath?.remove();
                return false;
            }
            return true;
        });
        return result;
    }

    unselectAll() {
        this.selections.forEach(selection => {
            this.unselectBlock(selection.blockSvg);
        });
        this.selections = [];
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
