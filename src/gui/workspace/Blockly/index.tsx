import { useEffect, useRef } from 'react';
import { events, type IVM } from '../../../types/vm';

const BlocklyWorkspace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleTargetChanged = () => {
            restartWorkspace();
        };
        const restartWorkspace = () => {
            if (!workspaceDiv.current) return;
            if (vm.runtime.blocks.workspaceSvg) vm.runtime.blocks.dispose();

            void vm.runtime.blocks.createWorkspace(workspaceDiv.current);
        };
        vm.off(events.SWITCH_TARGET, handleTargetChanged);
        vm.on(events.SWITCH_TARGET, handleTargetChanged);
        restartWorkspace();
        return () => {
            vm.runtime.blocks.dispose();
            // 扣式咯，他是头猪
            //-w-//
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div ref={workspaceDiv} style={{ width: '100%', height: '100%' }} />;
};

export default BlocklyWorkspace;
