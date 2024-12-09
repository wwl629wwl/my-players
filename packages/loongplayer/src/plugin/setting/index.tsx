import { createSignal, JSX } from 'solid-js';
import { UIPlugin } from '../../base/ui.plugin';
import './index.less';
import { setting } from '../../assets/svg';
import { Panel } from 'loongplayer-components';

export class Setting extends UIPlugin {
    protected name: string = 'ctrl-setting';

    protected render(): JSX.Element | string | HTMLElement {
        const { state, setState } = this.player.rootStore.settingStore;
        const [settingPanelShow, setSettingPanelShow] = createSignal(false);

        const handleClick = () => {
            setSettingPanelShow(v => !v);
        }

        const handleBack = () => {
            setState('sidePanel', {
                ...state.sidePanel,
                items: null
            })
            setState('mainPanel', {
                ...state.mainPanel,
                items: this.player.rootStore.settingStore.mainPanelItems
            })
        }

        return (
            <div class="loplayer-controller-middle-item loplayer-setting-controller">
                <div innerHTML={setting} style={{ width: '48px', height: '48px' }} onClick={handleClick} classList={{
                    "loplayer-setting-controller-icon": true,
                    "active": settingPanelShow()
                }}></div>
                <div class='loplayer-setting-panel-container'>
                    <Panel main={state.mainPanel} side={state.sidePanel} hidden={!setSettingPanelShow()} onBackClick={handleBack} />
                </div>
            </div>
        )
    }

    protected afterRender(): void {
        this.player.nodes.controllerBarMiddleRight.append(this.element);
    }

}