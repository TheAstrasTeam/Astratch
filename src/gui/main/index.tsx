import type { IVM } from "../../types/vm"
import WorkSpace from "../blocks"
import './index.css'


const GUI = (
    {vm}: {vm: IVM}
): React.ReactElement => {

    return (
        <div className="app">
            <button onClick={() => {
                vm.selectProject();
            }}>select a folder</button>
            <WorkSpace
                vm={vm}
            />
        </div>
    )
}

export default GUI