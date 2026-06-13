import type { IFVM } from "../../typescript/interface"
import WorkSpace from "../blocks"
import './index.css'


const GUI = (
    {
        vm
    }: {
        vm: IFVM
    }
): React.ReactElement => {

    return (
        <div className="app">
            <WorkSpace
                vm={vm}
            />
        </div>
    )
}

export default GUI