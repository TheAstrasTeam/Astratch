import { VM } from "../../vm"
import WorkSpace from "../blocks"
import './index.css'

export interface GUI_props {
    vm: VM
}

const GUI = (
    {
        vm
    }: GUI_props
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