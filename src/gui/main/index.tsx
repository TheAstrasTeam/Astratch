import { VM } from "../../vm"
import WorkSpace from "../blocks"
import './index.css'


const GUI = (
    {
        vm
    }: {
        vm: VM
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