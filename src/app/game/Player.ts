import { Container, Point } from 'pixi.js';
import { Card, CardModel } from './Card';
import { Button } from '../ui/Button';
import { EventManager } from '../utils/EventManager';
import { Label } from '../ui/Label';
import { Size } from './GameManager';
import gsap from 'gsap';
export class Player extends Container {
    label: string;
    private hands: Card[];
    private passButton: Button;
    private playButton: Button;
    private callButton: Button;
    private noCallButton: Button;
    private nameLabel: Label;
    private bidLabel: Label;
    private gameSize: Size;
    private isMe: boolean;
    private seating: number;
    private eventManager: EventManager;
    private isBid: boolean = false;

    constructor(
        name: string,
        seating: number,
        eventManager: EventManager,
        gameSize: Size
    ) {
        super();
        this.label = name;
        this.hands = [];
        this.seating = seating;
        this.isMe = seating === 0;
        this.eventManager = eventManager;
        this.gameSize = gameSize;

        this.nameLabel = new Label({
            text: name,
            style: {
                fill: 0xffffff,
            },
        });
        this.nameLabel.y = 105;
        this.addChild(this.nameLabel);

        this.passButton = new Button({
            text: '过',
            width: 150,
            height: 120,
        });
        this.passButton.visible = false;
        this.passButton.y = -160;
        this.passButton.x = -100;
        this.passButton.onPress.connect(this.handlePassButtonClick.bind(this));
        this.addChild(this.passButton);

        this.callButton = new Button({
            text: '叫地主',
            width: 150,
            height: 120,
        });
        this.callButton.visible = false;
        this.callButton.y = -160;
        this.callButton.x = -100;
        this.callButton.onPress.connect(this.handleCallButtonClick.bind(this));
        this.addChild(this.callButton);

        this.noCallButton = new Button({
            text: '不叫',
            width: 150,
            height: 120,
        });
        this.noCallButton.visible = false;
        this.noCallButton.y = -160;
        this.noCallButton.x = 100;
        this.noCallButton.onPress.connect(
            this.handleNoCallButtonClick.bind(this)
        );
        this.addChild(this.noCallButton);

        this.playButton = new Button({
            text: '出牌',
            width: 150,
            height: 120,
        });
        this.playButton.visible = false;
        this.playButton.y = -160;
        this.playButton.x = 100;
        this.playButton.onPress.connect(this.handlePlayButtonClick.bind(this));
        this.addChild(this.playButton);

        this.bidLabel = new Label({
            text: '叫地主',
            style: {
                fill: 0xffffff,
            },
        });
        if (this.isMe) {
            this.bidLabel.y = -160;
            this.bidLabel.x = 0;
        } else if (this.seating < 0) {
            this.bidLabel.y = 0;
            this.bidLabel.x = 150;
        } else {
            this.bidLabel.y = 0;
            this.bidLabel.x = -150;
        }
        this.bidLabel.visible = false;
        this.addChild(this.bidLabel);
    }

    public setName(name: string) {
        this.nameLabel.text = name;
    }

    public getName() {
        return this.nameLabel.text;
    }

    public getBid() {
        return this.isBid;
    }

    public setHands(cards: CardModel[]) {
        return new Promise(resolve => {
            const screenWidth = this.gameSize.width;
            const screenHeight = this.gameSize.height;
            const globalCenter = new Point(screenWidth / 2, screenHeight / 2);
            const localCenter = this.toLocal(globalCenter);
            this.hands = cards.map(card => new Card(card.color, card.value));
            this.hands.forEach((card, index) => {
                card.x = localCenter.x - card.width / 2;
                card.y = localCenter.y - card.height / 2;
                this.addChild(card);
                gsap.to(card, {
                    x: !this.isMe ? 0 : 63 * index - 60 * (cards.length / 2),
                    y: 0,
                    duration: 0.3,
                    ease: 'sina.in',
                    delay: index * 0.1,
                    onComplete: () => {
                        if (this.isMe) {
                            card.flip();
                        }
                        if (index === cards.length - 1) {
                            resolve(true);
                        }
                    },
                });
            });
        });
    }

    private handlePlayButtonClick() {
        if (!this.isMe) return;
        this.eventManager.emit('play-card', this);
    }

    private handlePassButtonClick() {
        if (!this.isMe) return;
        this.eventManager.emit('pass-card', this);
    }

    private handleCallButtonClick() {
        if (!this.isMe) return;
        this.hideCallButtons();
        this.bidLabel.text = this.isBid ? '叫地主' : '不叫';
        if (!this.bidLabel.visible) {
            this.bidLabel.visible = true;
        }
        this.eventManager.emit('call-landlord', this);
    }

    private handleNoCallButtonClick() {
        if (!this.isMe) return;
        this.hideCallButtons();
        this.bidLabel.text = this.isBid ? '叫地主' : '不叫';
        if (!this.bidLabel.visible) {
            this.bidLabel.visible = true;
        }
        this.eventManager.emit('no-call-landlord', this);
    }

    public showCallButtons() {
        if (!this.isMe) return;
        this.hidePlayButtons();
        this.callButton.visible = true;
        this.noCallButton.visible = true;
    }

    public hideCallButtons() {
        if (!this.isMe) return;
        this.callButton.visible = false;
        this.noCallButton.visible = false;
    }

    public showPlayButtons() {
        if (!this.isMe) return;
        this.hideCallButtons();
        this.playButton.visible = true;
        this.passButton.visible = true;
    }

    public hidePlayButtons() {
        if (!this.isMe) return;
        this.playButton.visible = false;
        this.passButton.visible = false;
    }

    public hideBidLabel() {
        if (this.bidLabel?.visible) {
            this.bidLabel.visible = false;
        }
    }

    public bidLandlord() {
        if (!this.isMe) {
            const bid = Math.random() < 0.5;
            this.isBid = bid;
            this.bidLabel.text = bid ? '叫地主' : '不叫';
            if (!this.bidLabel.visible) {
                this.bidLabel.visible = true;
            }
            this.eventManager.emit(
                bid ? 'call-landlord' : 'no-call-landlord',
                this
            );
        } else {
            this.showCallButtons();
        }
    }
}
