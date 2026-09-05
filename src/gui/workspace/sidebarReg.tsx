import { t } from 'i18next';
import type { ISideTabsStore } from '../../stores/useSidetabsStore';
import { spawnRandomString } from '../../utils/ash-data';

import spriteIcon from '../../assets/sprite.svg';
import addonsIcon from '../../assets/addons.svg';
import debuggerIcon from '../../assets/debugger.svg';
import assetsIcon from '../../assets/assets.svg';

import TargetsPanel from './targets';
import AddonsPanel from './addons';
import { AssetsPanel } from './assets';
import SelectBar from '../../components/workspace/selectBar';
import type { IVM } from '../../types/vm/vm';

const registerBuiltInSideTabs = (state: ISideTabsStore, vm: IVM) => {
    const resultIds: string[] = [];
    const targetTabId = spawnRandomString();
    resultIds.push(
        state.newTab({
            id: targetTabId,
            title: t('gui:target.title'),
            icon: spriteIcon,
            dom: (
                <SelectBar title={t('gui:target.title')}>
                    <TargetsPanel vm={vm} />
                </SelectBar>
            ),
        }),
    );
    resultIds.push(
        state.newTab({
            id: spawnRandomString(),
            title: t('gui:assets.title'),
            icon: assetsIcon,
            dom: (
                <SelectBar title={t('gui:assets.title')}>
                    <AssetsPanel vm={vm} />
                </SelectBar>
            ),
        }),
    );
    resultIds.push(
        state.newTab({
            id: spawnRandomString(),
            mode: 'split',
        }),
    );

    resultIds.push(
        state.newTab({
            id: spawnRandomString(),
            title: t('gui:addon.title'),
            icon: addonsIcon,
            dom: (
                <SelectBar title={t('gui:addon.title')}>
                    <AddonsPanel vm={vm} />
                </SelectBar>
            ),
        }),
    );
    resultIds.push(
        state.newTab({
            id: spawnRandomString(),
            title: t('gui:debug.title'),
            icon: debuggerIcon,
            dom: (
                <SelectBar title={t('gui:debug.title')}>
                    <span>Coming soon...</span>
                </SelectBar>
            ),
        }),
    );
    // TODO: 可能需要允许自定义？
    state.openTab(targetTabId);
    return resultIds;
};
export { registerBuiltInSideTabs };
