import { Card } from './Card';

export class Player {
    name: string;
    hand: Card[];

    constructor(name: string) {
        this.name = name;
        this.hand = [];
    }

    drawCard(deck: Card[]): void {
        if (deck.length > 0) {
            this.hand.push(deck.pop()!);
        }
    }

    playCard(card: Card): boolean {
        // 这里假设已经验证了玩家是否可以打出这张牌
        const index = this.hand.indexOf(card);
        if (index !== -1) {
            this.hand.splice(index, 1);
            return true;
        }
        return false;
    }

    hasUno(): boolean {
        return this.hand.length === 1;
    }

    getHand(): Card[] {
        return this.hand;
    }
}
