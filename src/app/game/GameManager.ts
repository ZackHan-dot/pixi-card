import { Container, Ticker } from 'pixi.js';
import { EventManager } from '../utils/EventManager';
import { Player } from './Player';
import { generateRandomHands, InitDeckInfo } from './Core';
import { GameState, StateMachine } from './GameMachine';
import { Card } from './Card';
import { PlayerQueue } from './PlayerQueue';
import { isEmptyArray } from '../../engine/utils/common';
import gsap from 'gsap';

enum GameStatus {
    INITED,
    DEALED,
}

export interface Size {
    width: number;
    height: number;
}

export class GameManager {
    private static instance: GameManager;
    private players: Player[] = [];
    private gameView: Container;
    private gameSize: Size;
    private gameStatus: GameStatus | null = null;
    private initDeckInfo: InitDeckInfo | null = null;
    private eventManager: EventManager = new EventManager();
    private stateMachine: StateMachine;
    private playerQueue: PlayerQueue | null = null;
    private bidLandlordCount: number = 0;
    private landlord: Player | null = null;
    private constructor(gameSize: Size, gameView: Container) {
        this.gameSize = gameSize;
        this.gameView = gameView;
        this.eventManager.on('play-card', this.handlePlayerPlayCard.bind(this));
        this.eventManager.on('pass-card', this.handlePlayerPassCard.bind(this));
        this.eventManager.on(
            'no-call-landlord',
            this.handlePlayerNoCallLandlord.bind(this)
        );
        this.eventManager.on(
            'call-landlord',
            this.handlePlayerCallLandlord.bind(this)
        );

        // 初始化状态机
        this.stateMachine = new StateMachine(GameState.INIT);
        this.initStateMachine();
    }

    private static create(gameSize: Size, gameView: Container) {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager(gameSize, gameView);
        }
        return GameManager.instance;
    }

    public static getInstance(gameSize: Size, gameView: Container) {
        return GameManager.create(gameSize, gameView);
    }

    public startGame() {
        this.stateMachine.update(null); // 进入初始状态
    }

    private initStateMachine() {
        // 添加状态
        this.stateMachine.addState(
            GameState.INIT,
            this.initState.bind(this),
            true
        );
        this.stateMachine.addState(
            GameState.SHUFFLE_AND_DEAL,
            this.shuffleAndDeal.bind(this)
        );
        this.stateMachine.addState(GameState.BIDDING, this.bidding.bind(this));
        this.stateMachine.addState(
            GameState.RETRY_BIDDING,
            this.retrybidding.bind(this)
        );
        this.stateMachine.addState(GameState.PLAYING, this.playing.bind(this));
        // this.stateMachine.addState(
        //     GameState.PLAYER_TURN,
        //     this.playerTurn.bind(this)
        // );
        // this.stateMachine.addState(GameState.PAUSE, this.pause.bind(this));
        // this.stateMachine.addState(
        //     GameState.SETTLEMENT,
        //     this.settlement.bind(this)
        // );
        // this.stateMachine.addState(
        //     GameState.SHOW_WINNER,
        //     this.showWinner.bind(this)
        // );
        // this.stateMachine.addState(
        //     GameState.NEW_ROUND,
        //     this.newRound.bind(this)
        // );
        // this.stateMachine.addState(GameState.END, this.endGame.bind(this));

        // 添加状态转换
        this.stateMachine.addTransition(
            GameState.INIT,
            GameState.SHUFFLE_AND_DEAL,
            () => this.gameStatus === GameStatus.INITED
        );
        this.stateMachine.addTransition(
            GameState.SHUFFLE_AND_DEAL,
            GameState.BIDDING,
            () => this.gameStatus === GameStatus.DEALED
        );
        this.stateMachine.addTransition(
            GameState.BIDDING,
            GameState.PLAYING,
            () =>
                this.bidLandlordCount === this.players.length &&
                this.landlord !== null
        );
        // this.stateMachine.addTransition(
        //     GameState.PLAYING,
        //     GameState.PLAYER_TURN,
        //     () => true
        // );
        // this.stateMachine.addTransition(
        //     GameState.PLAYER_TURN,
        //     GameState.PLAYING,
        //     () => true
        // );
        // this.stateMachine.addTransition(
        //     GameState.PLAYING,
        //     GameState.SETTLEMENT,
        //     () => this.isGameOver()
        // );
        // this.stateMachine.addTransition(
        //     GameState.SETTLEMENT,
        //     GameState.SHOW_WINNER,
        //     () => true
        // );
        // this.stateMachine.addTransition(
        //     GameState.SHOW_WINNER,
        //     GameState.NEW_ROUND,
        //     () => true
        // );
        // this.stateMachine.addTransition(
        //     GameState.NEW_ROUND,
        //     GameState.SHUFFLE_AND_DEAL,
        //     () => true
        // );
        // this.stateMachine.addTransition(
        //     GameState.SETTLEMENT,
        //     GameState.END,
        //     () => !this.shouldStartNewRound()
        // );
    }

    private initState(_input: any): void {
        console.log('初始化游戏阶段');
        if (!isEmptyArray(this.players)) {
            console.warn('游戏已初始化，请勿重复初始化');
            return;
        }
        const gWidth = this.gameSize.width;
        const gHeight = this.gameSize.height;
        const playerPos = [
            { x: -gWidth / 2 + 155, y: -gHeight / 2 + 200, seating: -1 },
            { x: 0, y: gHeight / 2 - 135, seating: 0 },
            { x: gWidth / 2 - 155, y: -gHeight / 2 + 200, seating: 1 },
        ];
        for (let i = 0; i < 3; i++) {
            const player = new Player(
                `player${i + 1}`,
                playerPos[i].seating,
                this.eventManager,
                this.gameSize
            );
            const names = ['陈自成', '韩宗源', '鹤云'];
            player.setName(names[i]);
            player.position.set(playerPos[i].x, playerPos[i].y);
            this.players.push(player);
            this.gameView.addChild(player);
        }
        this.playerQueue = new PlayerQueue(this.players);
        this.gameStatus = GameStatus.INITED;
    }

    private async shuffleAndDeal(_input: any) {
        console.log('洗牌发牌阶段');
        if (!this.initDeckInfo) {
            this.initDeckInfo = generateRandomHands();
            const setHandsActions: any[] = [];
            const bottomCardActions: any[] = [];
            for (let i = 0; i < 3; i++) {
                const player = this.players[i];
                const hands = this.initDeckInfo.playerCards.shift();
                if (hands) {
                    setHandsActions.push(player.setHands(hands));
                }
            }
            this.initDeckInfo.bottomCards
                .map(card => new Card(card.color, card.value))
                .forEach((card, i) => {
                    card.label = `bottomCard${i}`;
                    card.x = -card.width / 2 + (card.width + 5) * i - 65;
                    card.y = -this.gameSize.height / 2 + card.height / 2 + 30;
                    bottomCardActions.push(async () => await card.flip());
                    this.gameView.addChild(card);
                });
            Promise.all(setHandsActions).then(() => {
                Promise.all(bottomCardActions.map(cb => cb())).then(() => {
                    gsap.delayedCall(1, () => {
                        this.gameStatus = GameStatus.DEALED;
                    });
                });
            });
        }
    }

    private bidding(_input: any): void {
        console.log('叫地主阶段');
        // 玩家叫地主逻辑
        if (this.playerQueue) {
            if (this.bidLandlordCount === this.players.length) {
                if (this.landlord) {
                    console.log(`地主是：${this.landlord.getName()}`);
                    this.landlord.setName(`${this.landlord.getName()}（地主）`);
                    setTimeout(() => {
                        this.players.forEach(player => {
                            player.hideBidLabel();
                        });
                    }, 1500);
                } else {
                }
            } else {
                const currentPlayer = this.playerQueue.getNextPlayer();
                currentPlayer.bidLandlord();
            }
        } else {
            console.warn('玩家队列未初始化');
        }
    }

    private retrybidding(_input: any) {
        console.log('重新叫地主阶段');
        // 重新叫地主逻辑
    }

    // PLAYING 状态
    private playing(_input: any): void {
        // 立即切换到 PLAYER_TURN 状态，处理当前玩家的出牌
        console.log('出牌阶段');
    }

    // // PLAYER_TURN 状态
    // private playerTurn(_input: any): void {
    //     const currentPlayer = this.playerQueue.getCurrentPlayer();

    //     // 如果当前玩家是地主且是第一轮出牌，则允许地主先出牌
    //     if (
    //         this.landlord &&
    //         currentPlayer === this.landlord &&
    //         !this.currentHand.length
    //     ) {
    //         console.log(`Landlord ${this.landlord.id} starts the game.`);
    //     }

    //     // 玩家出牌逻辑
    //     const hand = currentPlayer.play(this.currentHand);

    //     if (hand.length > 0) {
    //         // 更新当前手牌
    //         this.currentHand = hand;
    //         this.lastPlayer = currentPlayer;
    //         console.log(`Player ${currentPlayer.id} played:`, hand);
    //     } else {
    //         console.log(`Player ${currentPlayer.id} passed.`);
    //     }

    //     // 检查游戏是否结束
    //     if (this.isGameOver()) {
    //         this.stateMachine.transitionTo(GameState.SETTLEMENT);
    //     } else {
    //         // 切换到下一个玩家
    //         this.playerQueue.getNextPlayer();
    //         this.stateMachine.transitionTo(GameState.PLAYING);
    //     }
    // }

    private handlePlayerPlayCard(player: Player) {
        console.log(player);
    }

    private handlePlayerPassCard(player: Player) {
        console.log(player);
    }

    private handlePlayerNoCallLandlord(player: Player) {
        console.log(`${player.getName()} 选择不叫地主`);
        this.bidLandlordCount++;
        this.bidding(null);
    }

    private handlePlayerCallLandlord(player: Player) {
        console.log(`${player.getName()} 选择叫地主`);
        this.landlord = player;
        this.bidLandlordCount++;
        this.bidding(null);
    }

    public update(_time: Ticker) {
        this.stateMachine.update(_time);
    }

    public deploy() {
        this.players = [];
        this.eventManager.off(
            'play-card',
            this.handlePlayerPlayCard.bind(this)
        );
        this.eventManager.off(
            'pass-card',
            this.handlePlayerPassCard.bind(this)
        );
        this.eventManager.off(
            'no-call-landlord',
            this.handlePlayerNoCallLandlord.bind(this)
        );
        this.eventManager.off(
            'call-landlord',
            this.handlePlayerCallLandlord.bind(this)
        );
    }
}
