import { JSX } from "solid-js";
import { UIPlugin } from "../../base/ui.plugin";
import Utils from "../../shared/utils";
import './index.less';

export class TimeLabel extends UIPlugin {
    protected name: string = 'time-label';

    protected render(): JSX.Element | string | HTMLElement {
        const { state } = this.player.rootStore.mediaStore;
        return (
            <div class="loplayer-controller-time-label-container">
                <span class="current-time">{Utils.formatTime(state.currentTime)}</span>
                <span class="split"> / </span>
                <span class="total-time">{Utils.formatTime(state.totalTime)}</span>
            </div>
        )
    }

    protected afterRender(): void {
        this.player.nodes.controllerBarMiddleLeft.append(this.element);
    }

}