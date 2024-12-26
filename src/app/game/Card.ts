import { Container } from 'pixi.js';

export type CardColor = 'Red' | 'Yellow' | 'Green' | 'Blue' | 'Black';
export type CardValue =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 'Skip'
    | 'Reverse'
    | 'DrawTwo'
    | 'Wild'
    | 'DrawFour';

export class Card extends Container {
    color: CardColor;
    value: CardValue;

    constructor(color: CardColor, value: CardValue) {
        super();
        this.color = color;
        this.value = value;
    }
}
