import type { IVM } from "../../types/vm"
import WorkSpace from "../blocks"
import './index.css'


const GUI = (
    {vm}: {vm: IVM}
): React.ReactElement => {
    return (
        <div className="app">
            <button onClick={async () => {
                await vm.selectProject();
            }}>select a folder</button>
            <button onClick={async() => {
                await vm.initProject()
            }}>init project</button>
            <WorkSpace
                vm={vm}
            />
        </div>
    )
}

export default GUI