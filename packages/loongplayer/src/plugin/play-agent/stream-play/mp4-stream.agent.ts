import LoongPlayer from "../../../player";
import mp4box, { MP4ArrayBuffer, MP4File, MP4SourceBuffer } from 'mp4box';
import { PlayerConfig } from "../../../types";

export class Mp4StreamAgent {
    private readonly mp4boxFile: MP4File;
    private readonly videoProxy: HTMLVideoElement;

    private config: PlayerConfig;

    /**
      * @desc 视频的总大小，单位为字节
      */
    private totalSize: number = 0
    /**
     * @desc 设置加载分片的起始位置，单位为字节
     */
    private chunkStart: number = 0
    /**
     * @desc 设置加载分片的大小，单位为字节
     */
    private chunkSize: number = 1024 * 1024
    /**
     * @desc 设置加载分片的间隔，单位为毫秒
     */
    private loadGap: number = 500
    /**
     * @desc 定时器
     */
    private timer: number = -1

    private isStreamEnd: boolean = false;

    private mediaSource: MediaSource;
    private pendingInits: number = 0;

    private pendingMap: Map<string | number,
        {
            sourceBuffer: SourceBuffer
            pendingSegments: {
                id: number
                user: MP4SourceBuffer
                buffer: MP4ArrayBuffer
                sampleNum: number
                is_last: boolean
            }[]
        }> = new Map();

    constructor(private player: LoongPlayer) {
        this.videoProxy = this.player.nodes.videoElement;
        this.config = this.player.config;
        this.mp4boxFile = mp4box.createFile();
        // 初始化并创建监听事件
        this.init();
        this.addEvents();
    }

    private init() {
        this.mediaSource = new MediaSource()
        // 静态方法创建一个用于表示参数中给出的对象的 URL 的字符串。
        this.videoProxy.src = window.URL.createObjectURL(this.mediaSource)

        this.mediaSource.addEventListener('sourceopen', (e) => {
            console.log('[Agent Event] sourceopen')
            this.start()
        })
    }

    private addEvents() {
        this.mp4boxFile.onMoovStart = () => {
            console.log('[Agent Event] onMoovStart')
        }
        //* 如果是fmp4类型的视频,则最后视频总时长的计算方式是使用fragment_duration，否则使用duration */
        this.mp4boxFile.onReady = (info) => {
            console.log('[Agent Event] onReady', info)
            this.stop();
            if (info.isFragmented) {
                this.mediaSource.duration = info.fragment_duration / info.timescale
            } else {
                this.mediaSource.duration = info.duration / info.timescale
            }

            info.tracks.forEach((track) => {
                const codec = track.codec;
                const mime = 'video/mp4; codecs="' + codec + '"';
                if (MediaSource.isTypeSupported(mime)) {
                    console.log(
                        '[Agent SourceBuffer Init]',
                        'MSE - SourceBuffer #' + track.id,
                        "Creation with type '" + mime + "'"
                    );
                    const sourceBuffer = this.mediaSource.addSourceBuffer(mime);
                    sourceBuffer.addEventListener('error', (e) => {
                        console.error(
                            'MSE SourceBuffer error' + track.id,
                            track
                        )
                    })
                    this.pendingMap.set(track.id, {
                        sourceBuffer,
                        pendingSegments: [],
                    })
                    this.mp4boxFile.setSegmentOptions(track.id, sourceBuffer, {
                        nbSamples:
                            this.config.streamPlayOptions?.samples || 100,
                    })
                } else {
                    throw new Error('当前浏览器不支持' + mime + '媒体类型')
                }
            })
        }
        this.mp4boxFile.onSegment = (
            id: number,
            user: MP4SourceBuffer,
            buffer: MP4ArrayBuffer,
            sampleNum: number,
            is_last: boolean
        ) => {
            this.pendingMap.get(id)?.pendingSegments.push({
                id,
                user,
                buffer,
                sampleNum,
                is_last,
            })

            this.onUpdateEnd(id)
        }
    }

    /**
     *  这段代码是 onUpdateEnd 方法的一部分，目的是在处理视频流时，当一个 sourceBuffer 的更新操作完成后，
     * 检查是否有更多的数据片段
     * （pendingSegments）可以附加到该 sourceBuffer，并释放已使用的样本（samples）。
     * 这通常与 MediaSource API 和 MP4Box.js 结合使用，用于处理媒体流的分片和缓冲。
     */
    private onUpdateEnd(id: number) {
        const user = this.pendingMap.get(id).sourceBuffer;
        if (
            this.mediaSource.readyState === 'open' &&
            user.updating === false &&
            this.pendingInits === 0
        ) {
            const seg = this.pendingMap.get(id)?.pendingSegments.shift()
            if (!seg) return
            user.appendBuffer(seg.buffer)
            // 在此处释放不需要用到的sample
            this.mp4boxFile.releaseUsedSamples(id, seg.sampleNum)
        }
    }

    stop() {
        window.clearInterval(this.timer)
    }

    start() {
        this.timer = window.setTimeout(() => this.load(), this.loadGap);
    }

    resume() {
        this.stop();
        this.chunkStart = 0;
        this.totalSize = 0;
    }

    load() {
        console.log('[Agent Event] load video buffer');
        this.loadVideo().then(({ data, eof }) => {
            // 每次成功加载一个视频数据块后，使用 setTimeout 设置定时器，使得在一定时间间隔（this.loadGap）
            // 后重新调用 load 方法，继续加载下一块视频数据。
            this.timer = window.setTimeout(() => {
                this.load()
            }, this.loadGap);

            // 设置加载的 data 数据块的起始字节位置 fileStart 为当前 this.chunkStart，以便在后续的处理和解析时能跟踪当前数据块的起始位置。
            data.fileStart = this.chunkStart;
            // appendBuffer 会将数据添加到缓冲区，并返回下一个要加载的数据块的起始位置（nextStart），更新 this.chunkStart 以便加载下一个数据块。
            const nextStart = this.mp4boxFile.appendBuffer(data, eof);
            this.chunkStart = nextStart;
            /**
             * check()：这是一个递归检查函数，用来检查所有的 sourceBuffer 是否都已经完成更新，并且 mediaSource 的状态是否为 'open'。如果都满足条件，调用 mediaSource.endOfStream() 
             * 来通知浏览器流数据已经加载完毕。如果某个 sourceBuffer 还在更新，则继续通过 requestAnimationFrame 递归调用 check 函数，直到所有缓冲区都准备好。
                this.isStreamEnd = true：标记视频流已经结束。
                this.mp4boxFile.flush()：将 mp4boxFile 的缓冲区内容刷新到目标媒体源中，确保所有数据都已处理。
                this.stop()：停止当前的视频流加载过程，可能是停止定时器或清理相关资源。
                check() 函数会确保在所有缓冲区准备好之后结束流。
             */
            if (eof) {
                const check = () => {
                    let isReady = true;
                    this.pendingMap.forEach((item) => {
                        const buffer = item.sourceBuffer;
                        if (buffer.updating) isReady = false;
                    })
                    if (isReady && this.mediaSource.readyState === 'open') {
                        this.mediaSource.endOfStream()
                    } else {
                        window.requestAnimationFrame(check)
                    }
                }
                this.isStreamEnd = true
                this.mp4boxFile.flush()
                this.stop()
                check()
                return
            }
        })
    }

    /**
     * @param data 数据
     * @param eof 是否是文件结尾
     * @returns 
     */
    loadVideo(): Promise<{
        data: ArrayBuffer & { fileStart: number },
        eof: boolean
    }> {
        const url = this.player.config.url;
        return new Promise((resolve, reject) => {
            if (!('fetch' in window)) {
                reject(new Error('fetch is not supported'))
            }
            let eof = false;
            const chunkEnd = this.chunkStart + this.chunkSize - 1;
            fetch(url, {
                method: 'GET',
                headers: {
                    Range: `bytes=${this.chunkStart}-${chunkEnd}`
                },
            })
                .then((response) => {
                    const contentRange = response.headers.get('Content-Range')
                    if (contentRange) {
                        this.totalSize = +contentRange.split('/')[1]
                    }
                    return response.arrayBuffer()
                }).then((buffer) => {
                    // 如果接收到的 ArrayBuffer 长度与预期的 chunkSize 不相等，或
                    // 者返回的 ArrayBuffer 长度与文件总大小相等，或者 chunkEnd 超过或等于文件的总大小，认为已经到达文件末尾。
                    if (
                        buffer.byteLength !== this.chunkSize ||
                        this.totalSize === buffer.byteLength ||
                        (this.totalSize > 0 && chunkEnd >= this.totalSize)
                    ) {
                        eof = true
                    }
                    const data: (ArrayBuffer & { fileStart: number }) = buffer as (ArrayBuffer & { fileStart: number });
                    resolve({
                        data: data,
                        eof: eof,
                    })
                })
        })
    }
}