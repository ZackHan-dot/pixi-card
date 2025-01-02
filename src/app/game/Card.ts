import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';

export enum SpecialCard {
    LittleJoker = 'w1',
    BigJoker = 'w2',
}

export enum CardColor {
    None = 'none',
    Hearts = 'xin',
    Diamonds = 'pian',
    Clubs = 'hua',
    Spades = 'tao',
}
export enum NormalCard {
    A = 14,
    Two = 15,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    J = 11,
    Q = 12,
    K = 13,
}

export type CardModelValue = NormalCard | SpecialCard;

export interface CardModel {
    color: CardColor;
    value: NormalCard | SpecialCard;
}

export class Card extends Container {
    color: CardColor;
    value: CardModelValue;
    isFaceUp: boolean;
    cardSprite: Sprite;
    isPlayed: boolean = false;
    isSelect: boolean = false;

    constructor(
        color: CardColor,
        value: CardModelValue,
        isFaceUp: boolean = false
    ) {
        super();
        this.color = color;
        this.value = value;
        this.label = `${this.color},${this.value}`;
        this.isFaceUp = isFaceUp;
        this.cardSprite = new Sprite(Texture.from('back.png'));
        this.cardSprite.anchor.set(0.5);
        this.cardSprite.scale.set(0.5);
        this.cardSprite.on('pointerdown', this.onClick.bind(this));
        this.addChild(this.cardSprite);
        this.renderCard();
    }

    private renderCard() {
        if (this.isFaceUp) {
            if (this.color === CardColor.None) {
                this.cardSprite.texture = Texture.from(`${this.value}.png`);
            } else {
                this.cardSprite.texture = Texture.from(
                    `${this.value}_${this.color}.png`
                );
            }
        } else {
            this.cardSprite.texture = Texture.from('back.png');
        }
    }

    public setInteractive(interactive: boolean) {
        this.cardSprite.interactive = interactive;
    }

    public async flip() {
        this.isFaceUp = !this.isFaceUp;
        await gsap
            .timeline()
            .to(this.cardSprite.scale, { x: 0, duration: 0.3 })
            .call(() => this.renderCard())
            .to(this.cardSprite.scale, { x: 0.5, duration: 0.3 });
    }

    public async switchSelect() {
        if (this.isPlayed) return;
        this.isSelect = !this.isSelect;
        await gsap.to(this.cardSprite, {
            y: this.isSelect ? -70 : 0,
            duration: 0.1,
            ease: 'sine.in',
        });
    }

    public getIsPlayed() {
        return this.isPlayed;
    }

    private onClick() {
        this.switchSelect();
    }
}
