import { QuickOpen_coverLayer } from '../quickOpen';
import { Menubar } from './menubar';

export const Editor = () => {
    return (
        <div>
            <div>
                <Menubar />
            </div>
            <QuickOpen_coverLayer />
        </div>
    );
};
