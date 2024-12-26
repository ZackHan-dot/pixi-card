import { Player } from './Player';
import { Card, CardColor, CardValue } from './Card';

export class UnoGame {
    players: Player[];
    deck: Card[];
    discardPile: Card[];
    currentPlayerIndex: number;
    direction: 1 | -1;

    constructor(players: Player[]) {
        this.players = players;
        this.deck = this.createDeck();
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.direction = 1;
        this.shuffleDeck();
        this.dealCards();
        this.startGame();
    }

    createDeck(): Card[] {
        const colors: CardColor[] = ['Red', 'Yellow', 'Green', 'Blue'];
        const values: CardValue[] = [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            'Skip',
            'Reverse',
            'DrawTwo',
        ];
        const deck: Card[] = [];

        for (const color of colors) {
            for (const value of values) {
                deck.push(new Card(color, value));
                if (value !== 0) {
                    // 每个非0的牌有两张
                    deck.push(new Card(color, value));
                }
            }
        }

        // 添加黑色万能牌
        for (let i = 0; i < 4; i++) {
            deck.push(new Card('Black', 'Wild'));
            deck.push(new Card('Black', 'DrawFour'));
        }

        return deck;
    }

    shuffleDeck(): void {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards(): void {
        for (let i = 0; i < 7; i++) {
            for (const player of this.players) {
                player.drawCard(this.deck);
            }
        }
    }

    startGame(): void {
        // 翻开第一张牌作为弃牌堆的起始牌
        this.discardPile.push(this.deck.pop()!);
    }

    getCurrentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer(): void {
        this.currentPlayerIndex =
            (this.currentPlayerIndex + this.direction + this.players.length) %
            this.players.length;
    }

    canPlayCard(card: Card): boolean {
        const topCard = this.discardPile[this.discardPile.length - 1];
        return (
            card.color === topCard.color ||
            card.value === topCard.value ||
            card.color === 'Black'
        );
    }

    playCard(player: Player, card: Card): void {
        if (this.canPlayCard(card)) {
            if (player.playCard(card)) {
                this.discardPile.push(card);
                this.applyCardEffect(card);
                if (player.hasUno()) {
                    console.log(`${player.name} says UNO!`);
                    this.triggerEvent('uno', player); // 触发UNO事件
                }
                this.nextPlayer();
                this.triggerEvent('nextPlayer'); // 触发换人事件
            } else {
                console.log("You don't have that card!");
            }
        } else {
            console.log("You can't play that card!");
        }
    }

    applyCardEffect(card: Card): void {
        switch (card.value) {
            case 'Skip':
                this.nextPlayer();
                break;
            case 'Reverse':
                this.direction *= -1;
                break;
            case 'DrawTwo':
                this.getCurrentPlayer().drawCard(this.deck);
                this.getCurrentPlayer().drawCard(this.deck);
                this.nextPlayer();
                break;
            case 'DrawFour':
                this.getCurrentPlayer().drawCard(this.deck);
                this.getCurrentPlayer().drawCard(this.deck);
                this.getCurrentPlayer().drawCard(this.deck);
                this.getCurrentPlayer().drawCard(this.deck);
                this.nextPlayer();
                break;
            case 'Wild':
                // 这里可以添加选择颜色的逻辑
                break;
        }
    }

    isGameOver(): boolean {
        const isGameOver = this.players.some(
            player => player.getHand().length === 0
        );
        if (isGameOver) {
            this.triggerEvent('gameOver', this.getWinner()); // 触发游戏结束事件
        }
        return isGameOver;
    }

    getWinner(): Player | null {
        return (
            this.players.find(player => player.getHand().length === 0) || null
        );
    }

    // 添加事件触发机制，用于通知视图层和控制器层
    private eventListeners: { [key: string]: ((...args: any[]) => void)[] } =
        {};

    public on(event: string, listener: (...args: any[]) => void) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(listener);
    }

    private triggerEvent(event: string, ...args: any[]) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(listener => listener(...args));
        }
    }
}
