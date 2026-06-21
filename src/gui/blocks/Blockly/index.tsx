import  { useEffect, useRef } from 'react';
import type { IVM } from '../../../types/vm';

const BlocklyWorkspace = ({vm}:{vm:IVM}) => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!workspaceDiv.current) return

        const workspace = vm.Blocks.createWorkspace(workspaceDiv.current)

        return () => {
            vm.Blocks.dispose();
            // 扣式咯，他是头猪
            //-w-//
        };
    }, [])

    /*
     * todo:
     * 我们需要解决工作区的某些BUG，并且接入 Continuous-Toolbox 插件
     * 我知道赛博猫猫看见这个注释的时候已经放学了
     * 所以这个东西留给赛博猫猫做
     * （拜托我做了很多工作的好不好）
     */

    return (
        <div ref={workspaceDiv} style={{ width: '100%', height: '100%' }} />
    )
}

export default BlocklyWorkspace