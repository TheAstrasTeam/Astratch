import { useEffect, useRef } from 'react';
import type { IVM } from '../../../types/vm';

const BlocklyWorkspace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!workspaceDiv.current) return;
        if (vm.Blocks.workspaceSvg) vm.Blocks.dispose();

        vm.Blocks.createWorkspace(workspaceDiv.current);

        return () => {
            vm.Blocks.dispose();
            // 扣式咯，他是头猪
            //-w-//
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div ref={workspaceDiv} style={{ width: '100%', height: '100%' }} />;
};

export default BlocklyWorkspace;
