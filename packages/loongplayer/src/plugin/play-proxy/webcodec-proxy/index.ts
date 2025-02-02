import BasePlugin from "../../../base/base.plugin";

export class WebCodecProxy extends BasePlugin {
    protected name: string = 'WebCodecProxy';
    protected canvas: HTMLCanvasElement;

    protected beforeInit(): void {
        this.canvas = document.createElement('canvas');
        this.player.config.proxy = () => {
            return this.canvas as unknown as HTMLVideoElement;
        }
    }


    protected install() {
        console.log('[Proxy Installed] The WebCodecProxy has been installed')
    }

    protected dispose(): void {
        console.log('[Proxy Disposed] The WebCodecProxy has been disposed')
    }

}