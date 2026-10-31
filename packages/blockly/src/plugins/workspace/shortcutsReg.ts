// 为多选工作区替换快捷键
import * as Blockly from 'blockly';
import { ashMultiSelectorManager } from './multiSelector';
import { t } from 'astratch-i18n';

/** 为多选工作区替换快捷键 */
export const registerMultiSelectShortcuts = () => {
    Blockly.ShortcutRegistry.registry.unregister(Blockly.ShortcutItems.names.DELETE);
    // 修改自 blockly/packages/blockly/core/shortcut_items.ts
    Blockly.ShortcutRegistry.registry.register(
        {
            name: Blockly.ShortcutItems.names.DELETE,
            preconditionFn(workspace, scope) {
                const focused = scope.focusedNode;
                const workspaceMSM = ashMultiSelectorManager.getWorkspace(workspace.id);
                const selectedBlocks = workspaceMSM?.getSelectedBlocks() ?? [];
                const focusDeletable = Blockly.isDeletable(focused) && focused.isDeletable();
                const anySelectedDeletable = selectedBlocks.some(b => b.blockSvg.isDeletable());
                const result =
                    !workspace.isReadOnly() &&
                    (focusDeletable || anySelectedDeletable) &&
                    !workspace.isDragging() &&
                    !Blockly.getFocusManager().ephemeralFocusTaken();
                if (!result) {
                    workspace.getAudioManager().playErrorBeep();
                }
                return result;
            },
            callback(workspace, e, _shortcut, scope) {
                e.preventDefault();
                const group = Blockly.Events.getGroup();
                Blockly.Events.setGroup(true);
                const focused = scope.focusedNode;
                if (focused instanceof Blockly.BlockSvg) {
                    if (focused.outputConnection) {
                        focused.dispose(false, true);
                    } else {
                        focused.dispose(true, true);
                    }
                } else if (Blockly.isDeletable(focused) && focused.isDeletable()) {
                    focused.dispose();
                    workspace.getAudioManager().play('delete');
                }

                const workspaceMSM = ashMultiSelectorManager.getWorkspace(workspace.id);
                workspaceMSM?.getSelectedBlocks().forEach(block => {
                    if (
                        block.blockSvg &&
                        block.blockSvg.isDeletable() &&
                        Blockly.isDeletable(block.blockSvg) &&
                        !block.blockSvg.isDeadOrDying()
                    ) {
                        if (block.blockSvg.outputConnection) {
                            block.blockSvg.dispose(false, true);
                        } else {
                            block.blockSvg.dispose(true, true);
                        }
                    }
                });
                workspaceMSM?.unselectAll();
                Blockly.Events.setGroup(group);
                return true;
            },
            keyCodes: [Blockly.utils.KeyCodes.DELETE, Blockly.utils.KeyCodes.BACKSPACE],
            displayText: () => Blockly.Msg['SHORTCUTS_DELETE'],
        },
        true,
    );
    Blockly.ShortcutRegistry.registry.register({
        name: 'selectAll',
        callback(workspace, e, _shortcut) {
            e.preventDefault();
            const group = Blockly.Events.getGroup();
            Blockly.Events.setGroup(true);
            const workspaceMSM = ashMultiSelectorManager.getWorkspace(workspace.id);
            workspace.getAllBlocks().forEach(block => {
                if (block && block.isMovable() && !block.isDeadOrDying())
                    workspaceMSM?.selectBlock(block);
            });
            Blockly.Events.setGroup(group);
            return true;
        },
        keyCodes: [
            Blockly.ShortcutRegistry.registry.createSerializedKey(Blockly.utils.KeyCodes.A, [
                Blockly.utils.KeyCodes.CTRL_CMD,
            ]),
        ],
        displayText: () => t('gui:selectAll'),
    });
};
