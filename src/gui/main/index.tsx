import { VM } from "../../vm"
import i18n from "../../i18n"
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
        {window.t('test')}
    </div>
    )
}

export default GUI