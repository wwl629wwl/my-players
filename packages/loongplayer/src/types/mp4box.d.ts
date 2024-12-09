declare module 'mp4box' {
    export interface MP4MediaTrack {
        id: number;     // 轨道ID
        created: Date;    // 创建时间
        modified: Date      // 修改时间
        movie_duration: number  // 视频时长
        layer: number            // 层
        alternate_group: number     // 交替组
        volume: number            // 音量
        track_width: number         // 轨道宽度
        track_height: number        // 轨道高度
        timescale: number          // 时间刻度
        duration: number            // 时长
        bitrate: number            // 比特率
        codec: string               // 编码
        language: string            // 语言
        nb_samples: number          // 样本数量w
    }

    export interface MP4VideoData {
        width: number
        height: number
    }

    export interface MP4VideoTrack extends MP4MediaTrack {
        video: MP4VideoData
    }

    export interface MP4AudioData {
        sample_rate: number
        channel_count: number
        sample_size: number
    }

    export interface MP4AudioTrack extends MP4MediaTrack {
        audio: MP4AudioData
    }

    export type MP4Track = MP4VideoTrack | MP4AudioTrack

    export interface LogInterface {
        debug: (module: string, msg: string) => void
        log: (module: string, msg: string) => void
        info: (module: string, msg: string) => void
        warn: (module: string, msg: string) => void
        error: (module: string, msg: any) => void
        [props: string]: any
    }

    export interface MP4Info {
        duration: number // 视频时长
        timescale: number // 时间刻度
        fragment_duration: number // 分段时长
        isFragmented: boolean  // 是否为分段文件
        isProgressive: boolean // 是否为渐进式文件
        hasIOD: boolean         // 是否有初始对象描述符
        brands: string[]        // 文件品牌
        created: Date           // 创建时间
        modified: Date          // 修改时间 
        tracks: MP4Track[]      // 轨道信息
    }

    export type MP4ArrayBuffer = ArrayBuffer & { fileStart: number }

    export type MP4MediaSource = MediaSource & {
        sb?: MP4SourceBuffer // SourceBuffer
        pendingInits?: number //    待处理的初始化请求
    }
    export type MP4SourceBuffer = SourceBuffer & {
        ms?: MP4MediaSource // 
        id?: number
        segmentIndex?: number
        pendingAppends?: any[]
        sampleNum?: number
        is_last?: boolean
    }

    export interface MP4File {
        /**
         * @desc当 MP4 文件的 "moov"（即电影头信息）开始解析时被调用。通常 moov 包含了视频文件的结构信息，播放时需要先读取这个部分。 
         */
        onMoovStart?: () => void
        /**
         * @description 当 MP4 文件准备好播放时调用，info 可能包含关于文件的元数据，例如时长、格式等信息。
        */
        onReady?: (info: MP4Info) => void
        /**
         * @desc 当发生错误时调用，e 参数为错误信息。这个方法用于处理文件加载或解析中的错误。
         */
        onError?: (e: string) => void
        /**
         * @desc 当某一视频分段数据（segment）被处理时调用。id 是该段的标识，user 是对应的 MP4SourceBuffer，buffer 是包含数据的数组缓冲区，sampleNum 是样本的数量，is_last 指示是否为最后一段。
         */
        onSegment?: (
            id: number,
            user: MP4SourceBuffer,
            buffer: MP4ArrayBuffer,
            sampleNum: number,
            is_last: boolean
        ) => void
        /**
        * @desc 当某一视频分段数据（segment）被处理时调用。id 是该段的标识，user 是对应的 MP4SourceBuffer，buffer 是包含数据的数组缓冲区，sampleNum 是样本的数量，is_last 指示是否为最后一段。
        */
        onItem?: (item: any) => void
        /**
        * @desc 向 SourceBuffer 中添加数据（MP4ArrayBuffer）。end 参数用于指示是否是最后一段数据。该方法返回一个数值，通常是添加的数据的字节数或者状态码。
        */
        appendBuffer(data: MP4ArrayBuffer, end?: boolean): number
        /**
        * @desc 设置分段的配置项。id 表示分段的标识符，sb 是 SourceBuffer，options 是一个可选的配置对象，可能包含如缓冲区大小、编码格式等信息。
        */
        setSegmentOptions(
            id: number,
            sb: SourceBuffer,
            options?: { [props: string]: any }
        ): void
        /**
        * @desc 初始化分段，返回一个对象数组，每个对象包含
        */
        initializeSegmentation(): {
            id: number
            user: MP4SourceBuffer
            buffer?: ArrayBuffer
        }[]
        /**
        * @desc 释放已经处理的样本数据。id 表示分段标识，samples 表示需要释放的样本数量。这个方法主要用于内存管理和缓冲区优化。
        */
        releaseUsedSamples(id: number, samples: number): void
        /**
        * @desc 启动视频处理或播放的过程。通常在所有的初始化步骤完成后调用这个方法。
        */
        start(): void
        /**
        * @desc 停止视频处理或播放。通常用于暂停或停止播放当前的视频内容。
        */
        stop(): void
        /**
        * @desc 刷新缓冲区，通常在完成数据处理时调用，确保所有的数据已经被写入并可以继续进行后续操作。
        */
        flush(): void
        /**
        * @desc 跳转到指定的时间 time，b 可能表示是否需要平滑跳转。返回一个包含 offset（偏移量）的对象，可能还会有其他信息，如跳转后的状态。
        */
        seek(time: number, b: boolean): { offset: number;[props: string]: any }
    }

    export const Log: LogInterface

    export function createFile(): MP4File

    export { }
}