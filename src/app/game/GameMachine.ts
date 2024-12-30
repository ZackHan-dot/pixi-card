export enum GameState {
    INIT, // 初始化游戏
    SHUFFLE_AND_DEAL, // 洗牌并发牌
    BIDDING, // 叫分阶段
    RETRY_BIDDING, // 重新叫分（如果无人叫分）
    PLAYING, // 玩家轮流出牌
    PLAYER_TURN, // 每个玩家的具体出牌轮次
    PAUSE, // 游戏暂停
    SETTLEMENT, // 结算阶段
    SHOW_WINNER, // 展示获胜者
    NEW_ROUND, // 开始新一局
    END, // 游戏结束
}

interface Transitions {
    [key: number]: {
        toState: GameState;
        condition: StateCondition;
    }[];
}

interface States {
    [key: number]: StateHandler;
}

type StateHandler = (input: any) => void;
type StateCondition = (input: any) => boolean;

export class StateMachine {
    private currentState: GameState;
    private nextState: GameState | null = null; // 用于追踪下一个状态
    private states: States;
    private transitions: Transitions;

    constructor(initialState: GameState) {
        this.currentState = initialState;
        this.states = {};
        this.transitions = {};
    }

    addState(
        stateName: GameState,
        handler: StateHandler,
        immediate: boolean = false
    ): void {
        this.states[stateName] = handler;
        if (immediate && stateName === this.currentState) {
            console.log(`立刻处理状态： ${stateName}`);
            this.handleState(stateName, null);
        }
    }

    addTransition(
        fromState: GameState,
        toState: GameState,
        condition: StateCondition
    ): void {
        if (!this.transitions[fromState]) {
            this.transitions[fromState] = [];
        }
        this.transitions[fromState].push({ toState, condition });
    }

    update(input: any): void {
        // 检查是否有符合条件的状态转换
        const currentTransitions = this.transitions[this.currentState];
        if (currentTransitions) {
            for (const transition of currentTransitions) {
                if (transition.condition(input)) {
                    this.transitionTo(transition.toState);
                    break;
                }
            }
        }

        // 如果有新的状态并且还没有处理过，则处理新状态
        if (this.nextState !== null) {
            this.handleState(this.nextState, input);
            this.nextState = null; // 重置下一个状态
        }
    }

    private transitionTo(newState: GameState): void {
        console.log(`将状态 ${this.currentState} 转换为 ${newState}`);
        this.nextState = newState;
    }

    private handleState(state: GameState, input: any): void {
        const stateHandler = this.states[state];
        if (stateHandler) {
            console.log(`正在处理状态: ${state}`);
            stateHandler(input);
        }
        this.currentState = state;
    }

    getCurrentState(): GameState {
        return this.currentState;
    }
}
