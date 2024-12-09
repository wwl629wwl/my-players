import { JSX } from "solid-js";
import { UIPlugin } from "../../base/ui.plugin";
import { pause, play } from "../../assets/svg";

export class PlayButton extends UIPlugin {
    protected name: string = 'play-button';

    protected render(): JSX.Element | string | HTMLElement {
        const { state, setState } = this.player.rootStore.mediaStore;
        const handleClick = () => {
            if (state.paused) {
                this.player.play();
            } else {
                this.player.pause();
            }
        }

        return (
            <div class="loplayer-controller-middle-item loplayer-controller-playbtn-container" onClick={handleClick}>
                <div innerHTML={state.paused ? play : pause} style={{ width: '100%', height: '100%' }}></div>
                <span class="loplayer-controller-middle-item-tip">{state.paused ? '播放' : '暂停'}</span>
            </div>
        )
    }

    protected afterRender(): void {
        this.player.nodes.controllerBarMiddleLeft.append(this.element);
    }

}