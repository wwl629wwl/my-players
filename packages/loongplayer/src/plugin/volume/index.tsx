import { createSignal, JSX } from "solid-js";
import { UIPlugin } from "../../base/ui.plugin";
import { volume } from "../../assets/svg";
import { Slider } from "loongplayer-components";

export class Volume extends UIPlugin {
    protected name: string = "volume";

    protected minProgress: number = 0.0025;
    protected maxProgress: number = 0.9;

    protected get progress() {
        const { state } = this.player.rootStore.mediaStore;
        const volume = state.volume;
        if (volume === 0) return this.minProgress;
        if (volume === 1) return this.maxProgress;
        return volume;
    }

    protected render(): JSX.Element | string | HTMLElement {
        const [hideSlider, setHideSlider] = createSignal(true);

        const handleVolumeChange = (val: number) => {
            let volume = val;
            if (val === this.minProgress) {
                volume = 0;
            } else if (val === this.maxProgress) {
                volume = 1;
            }
            this.player.setVolume(volume);
        }

        const handleMouseEnter = () => {
            setHideSlider(false);
        }

        const handleMouseLeave = () => {
            if (this.player.rootStore.actionStore.state.isVolumeDrag) return;
            setHideSlider(true)
        }

        return (
            <div class="loplayer-controller-middle-item loplayer-controller-volume-container"
                style={{ width: 'auto' }}
                onmouseenter={handleMouseEnter}
                onmouseleave={handleMouseLeave}
            >
                <div innerHTML={volume} style={{ width: '48px', height: '48px' }}></div>
                <div class="slider">
                    <Slider
                        progress={this.progress}
                        onChange={handleVolumeChange}
                        onMouseDown={() => this.player.rootStore.actionStore.setState("isVolumeDrag", true)}
                        onMouseUp={() => this.player.rootStore.actionStore.setState("isVolumeDrag", false)}
                        minProgress={this.minProgress}
                        maxProgress={this.maxProgress}
                        width={hideSlider() ? 0 : 60}
                        height={3}
                        dotHidden={hideSlider()}
                    />
                </div>
            </div>
        )
    }

    protected afterRender(): void {
        this.player.nodes.controllerBarMiddleLeft.appendChild(this.element);
    }
}