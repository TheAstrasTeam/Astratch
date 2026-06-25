import type { IVM } from '../../types/vm';
import WorkSpace from '../blocks';
import './index.css';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    return (
        <div className='app'>
            <div className='toolbar'>
                {/* 我添加了一个工具栏用来保证布局 */}
                <button
                    onClick={async () => {
                        await vm.selectProject();
                    }}
                >
                    select a folder
                </button>
                <button
                    onClick={async () => {
                        await vm.initProject();
                    }}
                >
                    init project
                </button>
            </div>
            <div className='workspace-area'>
                {/* 这是一个测试，给工作区包一个容器 */}
                <WorkSpace key='workspace' vm={vm} />
            </div>
        </div>
    );
};

export default GUI;
