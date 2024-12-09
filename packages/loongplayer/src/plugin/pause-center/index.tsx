import { JSX } from "solid-js/jsx-runtime";
import { UIPlugin } from "../../base/ui.plugin";
import './index.less';
import * as svg from '../../assets/svg';

export class PauseCenter extends UIPlugin {
    protected name: string = "pause-center";

    protected install(): void {
        super.install();
        this.player.useState(() => this.player.rootStore.mediaStore.state.paused, (paused) => {
            if (paused) {
                this.element.classList.remove("play");
            } else {
                this.element.classList.add("play");
            }
        }, {
            fireImmediately: true
        })
    }

    protected render(): JSX.Element | string | HTMLElement {
        return (
            <div class="loplayer-pause-center-container">
                <div class="loplayer-pause-center" innerHTML={svg.pauseCenter}></div>
            </div>
        )
    }


}