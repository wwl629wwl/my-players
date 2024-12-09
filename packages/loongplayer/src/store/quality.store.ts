import BaseStore from "../base/base.store";
import LoongPlayer from "../player";
import { LOONG_PLAYER_EVENT } from "../shared/event";
import { IQuality } from "../types";

interface QualityState {
    currentQn: number;
    qualityList: IQuality[];
    selectedQuality: IQuality;
    isChangeQuality: boolean;
}

export class QualityStore extends BaseStore<QualityState> {
    get defaultState(): QualityState {
        return {
            currentQn: 0,
            qualityList: [],
            selectedQuality: null,
            isChangeQuality: false,
        }
    }

    // 获取当前播放视频的清晰度
    get qualityTitle() {
        return this.state.selectedQuality?.name || "默认";
    }

    constructor(player: LoongPlayer) {
        super(player);
        this.setState("qualityList", [
            ...player.config.quality
        ])
    }

    internalRequestQuality(q: IQuality) {
        if (!q) return;
        if (q.qn === this.state.selectedQuality?.qn) return;
        if (this.state.isChangeQuality) {
            console.warn("正在切换清晰度中");
            return;
        }
        this.player.emit(LOONG_PLAYER_EVENT.VIDEO_QUALITY_CHANGING, q);
        this.setState("isChangeQuality", true);
        
    }
}