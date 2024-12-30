import { Player } from './Player';

// 定义玩家状态枚举
enum PlayerStatus {
    ACTIVE = 'ACTIVE', // 玩家可以叫分或出牌
    SKIPPED = 'SKIPPED', // 玩家跳过了本轮叫分或出牌
}

export class PlayerQueue {
    private queue: Player[];
    private currentPlayerIndex: number;
    private playerStatus: Map<Player, PlayerStatus>; // 记录每个玩家的状态

    constructor(players: Player[]) {
        this.queue = [...players]; // 复制玩家数组
        this.currentPlayerIndex = 0;
        this.playerStatus = new Map(); // 初始化玩家状态

        // 默认所有玩家都是活跃的
        for (let player of players) {
            this.playerStatus.set(player, PlayerStatus.ACTIVE);
        }
    }

    // 获取当前玩家并移动到下一个玩家
    getNextPlayer(): Player {
        let currentPlayer: Player | undefined;

        // 找到下一个活跃的玩家
        do {
            currentPlayer = this.queue[this.currentPlayerIndex];
            this.currentPlayerIndex =
                (this.currentPlayerIndex + 1) % this.queue.length;
        } while (
            currentPlayer &&
            this.playerStatus.get(currentPlayer) === PlayerStatus.SKIPPED
        );

        if (!currentPlayer) {
            throw new Error('队列中没有活跃玩家');
        }

        return currentPlayer;
    }

    // 标记玩家为跳过（仅跳过本轮）
    skipCurrentPlayer(): void {
        const currentPlayer = this.getCurrentPlayer();
        this.playerStatus.set(currentPlayer, PlayerStatus.SKIPPED);
        console.log(`${currentPlayer.getName()} 选择跳过`);
    }

    // 重置所有玩家的状态，准备下一轮
    resetPlayerStatus(): void {
        for (let player of this.queue) {
            this.playerStatus.set(player, PlayerStatus.ACTIVE);
        }
        console.log('所有玩家已重新准备就绪');
    }

    // 检查队列是否为空（即所有玩家都跳过了）
    isEmpty(): boolean {
        return this.queue.every(
            player => this.playerStatus.get(player) === PlayerStatus.SKIPPED
        );
    }

    // 获取当前玩家（不切换）
    getCurrentPlayer(): Player {
        return this.queue[this.currentPlayerIndex];
    }
}
