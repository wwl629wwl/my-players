import { createEffect } from "solid-js";
import { Plugin } from "./base/base.plugin";
import { EventEmitter3 } from "./base/event-emitter3";
import { defaultConfig } from "./shared/default-config";
import { LOONG_PLAYER_EVENT } from "./shared/event";
import { PlayerConfig } from "./types";
import { render } from "solid-js/web";
import { RootStore } from "./store/root.store";
import { IPanelItem } from "loongplayer-components";
import { Toast } from "./plugin/toast";
import { PauseCenter } from "./plugin/pause-center";
import { PlayAgent } from "./plugin/play-agent";
import { PlayWaiting } from "./plugin/play-waiting";
import { Progress } from "./plugin/progress";
import { PlayButton } from "./plugin/play-button";
import { Volume } from "./plugin/volume";
import { TimeLabel } from "./plugin/time-label";
import { VideoRecorder } from "./plugin/video-recorder";
import ImageShot from "./plugin/video-shot";
import { Setting } from "./plugin/setting";
import { PipInPip } from "./plugin/pip-in-pip";
import { FullScreen } from "./plugin/ctrl-fullscreen";
import { PlayQuality } from "./plugin/play-quality";
import { PlaybackRate } from "./plugin/playback-rate";
import { Subtitle } from "./plugin/subtitle";

export default class LoongPlayer extends EventEmitter3 {
    static Event: typeof LOONG_PLAYER_EVENT = LOONG_PLAYER_EVENT;
    public config: PlayerConfig
    public rootStore: RootStore;

    public nodes: {
        container: HTMLDivElement,
        videoArea: HTMLDivElement
        videoLayer: HTMLDivElement
        toastLayer: HTMLDivElement
        videoElement: HTMLVideoElement
        controllerBar: HTMLDivElement
        controllerBarTop: HTMLDivElement
        controllerBarMiddle: HTMLDivElement
        controllerBarBottom: HTMLDivElement
        controllerBarMiddleLeft: HTMLDivElement
        controllerBarMiddleMiddle: HTMLDivElement
        controllerBarMiddleRight: HTMLDivElement
        topArea: HTMLDivElement
        topAreaLeft: HTMLDivElement
        topAreaMiddle: HTMLDivElement
        topAreaRight: HTMLDivElement
    } = {
            container: null,
            videoArea: null,
            videoElement: null,
            videoLayer: null,
            toastLayer: null,
            controllerBar: null,
            controllerBarTop: null,
            controllerBarMiddle: null,
            controllerBarBottom: null,
            controllerBarMiddleLeft: null,
            controllerBarMiddleMiddle: null,
            controllerBarMiddleRight: null,
            topArea: null,
            topAreaLeft: null,
            topAreaMiddle: null,
            topAreaRight: null,
        }
    private disposeCallback: () => void

    private plugins: Plugin[] = [
        Toast,
        PauseCenter,
        PlayAgent,
        PlayWaiting,
        Progress,
        PlayButton,
        Volume,
        TimeLabel,
        VideoRecorder,
        ImageShot,
        Setting,
        PipInPip,
        FullScreen,
        PlayQuality,
        PlaybackRate,
        Subtitle
    ];

    constructor(options?: PlayerConfig) {
        super();
        this.config = Object.assign(defaultConfig, options);
        // #TODO 需要增加Rootstore
        this.rootStore = new RootStore(this);
        this.config.plugins && this.config.plugins.length > 0 && this.plugins.push(...this.config.plugins)
        this.renderPlugin();
        this.emit(LOONG_PLAYER_EVENT.BEFORE_INIT);
        this.renderTemplate();
    }

    /**
     * @desc 初始化内置插件
     */
    private renderPlugin() {
        this.plugins.forEach((P) => {
            new P(this);
        })
    }

    /**
     * @desc 构造播放器的整体DOM模板并且绑定相关事件
     */
    private renderTemplate(): void {
        const handleClick = () => {
            if (this.rootStore.mediaStore.state.paused) {
                this.play();
            } else {
                this.pause();
            }
        }

        const handleDoubleClick = () => {
            if (this.rootStore.mediaStore.state.isEnterFullscreen) {
                this.exitFullScreen();
            } else {
                this.requestFullScreen();
            }
        }

        const App = () => (
            <div class="loplayer-container" ref={this.nodes.container}>
                <div
                    class="loplayer-video-area"
                    ref={this.nodes.videoArea}
                    onClick={handleClick}
                    onDblClick={handleDoubleClick}
                >
                    {this.config.proxy ? (
                        this.config.proxy()
                    ) : (
                        <video
                            ref={this.nodes.videoElement}
                            autoplay
                            muted
                            crossOrigin="anonymous"
                        ></video>
                    )}
                </div>
                <div class="loplayer-video-layer"
                    ref={this.nodes.videoLayer}
                ></div>
                <div class="loplayer-toast-layer" ref={this.nodes.toastLayer}></div>
                <div
                    classList={{
                        'loplayer-controller-area': true,
                        hidden: this.rootStore.actionStore.state.isTopBarHidden,
                    }}
                    ref={this.nodes.controllerBar}
                >
                    <div class="loplayer-controller-area-top"
                        ref={this.nodes.controllerBarTop}
                    ></div>
                    <div
                        class="loplayer-controller-area-middle"
                        ref={this.nodes.controllerBarMiddle}
                    >
                        <div
                            class="loplayer-controller-area-middle-left"
                            ref={this.nodes.controllerBarMiddleLeft}
                        ></div>
                        <div
                            class="loplayer-controller-area-middle-middle"
                            ref={this.nodes.controllerBarMiddleMiddle}
                        ></div>
                        <div
                            class="loplayer-controller-area-middle-right"
                            ref={this.nodes.controllerBarMiddleRight}
                        ></div>
                    </div>
                    <div
                        class="loplayer-controller-area-bottom"
                        ref={this.nodes.controllerBarBottom}
                    ></div>
                </div>
            </div>
        )
        if (this.config.proxy) {
            this.nodes.videoElement = this.config.proxy()
        }
        this.disposeCallback = render(() => <App />, this.config.container)

        this.emit(LOONG_PLAYER_EVENT.MOUNTED)

    }

    /**
     * @desc 注册插件
     */
    public registerPlugin(plugin: Plugin) {
        new plugin(this);
    }

    /**
     * @desc 注册设置项
     */
    public registerSettingItem(item: IPanelItem) {
        // #TODO
        this.rootStore.settingStore.registerPanelItem(item);
    }

    /**
     * @desc 注册并且订阅播放器内部的state
     * @param getter
     */
    public useState<T>(
        getter: () => T,
        callback: (newVal: T) => void,
        options?: { fireImmediately?: boolean }
    ) {
        let isFirst = true;
        createEffect(() => {
            const val = getter();
            if (options?.fireImmediately && isFirst) {
                callback(val);
            } else if (!isFirst) {
                callback(val);
            }
            isFirst = false;
        })
    }

    /**
     * @desc 注册一个副作用函数, 可以自动进行依赖收集和依赖触发
     * @param handle
     */
    public useEffect(hanlde: () => void) {
        createEffect(hanlde);
    }

    /**
     * @desc 开始播放
     * @returns {Promise<any>}
     */
    public play(): Promise<any> {
        return this.nodes.videoElement.play();
    }

    /**
     * @desc 暂停播放
     * @returns {void}
     */
    public pause(): void {
        this.nodes.videoElement.pause();
    }

    public seek(time: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.nodes.videoElement.currentTime = Math.max(
                0,
                Math.min(time, this.nodes.videoElement.duration)
            )
            this.play();
            const onSeeked = () => {
                resolve(time);
                this.off(LOONG_PLAYER_EVENT.VIDEO_SEEKED, onSeeked);
            }
            this.on(LOONG_PLAYER_EVENT.VIDEO_SEEKED, onSeeked);
        })
    }

    /**
     * @desc 播放器进入全屏模式
     */
    public requestFullScreen(): Promise<void> {
        return this.config.container.requestFullscreen();
    }

    /**
     * @desc 播放器退出全屏模式
     * @returns 
     */
    public exitFullScreen(): Promise<void> {
        return (
            document.fullscreenElement &&
            document.fullscreenEnabled &&
            document.exitFullscreen()
        )
    }

    /**
     * @description 播放器进入画中画模式
     */
    public requestPipInPip(): Promise<PictureInPictureWindow> {
        return this.nodes.videoElement.requestPictureInPicture();
    }

    /**
     * @description 播放器退出画中画模式
     */
    public exitPipInPip(): Promise<void> {
        return document.exitPictureInPicture();
    }

    /**
     * @description 设置音量
     */
    public setVolume(val: number) {
        this.nodes.videoElement.volume = val;
    }

    /**
     * @description 设置倍速
     */
    public setPlaybackRate(val: number) {
        this.nodes.videoElement.playbackRate = val;
    }

    /**
     * @description 播放器销毁
     */
    public dispose() {
        this.disposeCallback?.();
        this.nodes = null;
        this.plugins = null;
    }
}