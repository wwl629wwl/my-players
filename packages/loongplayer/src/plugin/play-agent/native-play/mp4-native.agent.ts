import LoongPlayer from "../../../player";


export class Mp4NativeAgent {
    private videoProxy: HTMLVideoElement;
    // 等价于 private player: LoongPlayer; 然后自动赋值
    constructor(private player: LoongPlayer) {

        this.videoProxy = this.player.nodes.videoElement;
        this.init();
    }

    init() {
        console.log("[Agent Init] mp4-native agent init");
        this.videoProxy.src = this.player.config.url;
    }
}