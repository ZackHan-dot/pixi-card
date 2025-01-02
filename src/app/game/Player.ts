import { Container, Point } from 'pixi.js';
import { Card, CardModel } from './Card';
import { Button } from '../ui/Button';
import { EventManager } from '../utils/EventManager';
import { Label } from '../ui/Label';
import { Size } from './GameManager';
import gsap from 'gsap';
import { compareFn, findLargestHand } from './Core';
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
        this.passButton.y = -220;
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
        this.playButton.y = -220;
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

    private getLocalCenter() {
        const screenWidth = this.gameSize.width;
        const screenHeight = this.gameSize.height;
        const globalCenter = new Point(screenWidth / 2, screenHeight / 2);
        return this.toLocal(globalCenter);
    }

    public setHands(cards: CardModel[]) {
        return new Promise(resolve => {
            const localCenter = this.getLocalCenter();
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

    public setBottomHands(cards: CardModel[]) {
        return new Promise(resolve => {
            cards.forEach(card => {
                const cardInstance = new Card(
                    card.color,
                    card.value,
                    this.isMe
                );
                cardInstance.x = 0;
                cardInstance.y = 0;
                this.hands.push(cardInstance);
                this.addChild(cardInstance);
            });
            if (!this.isMe) {
                resolve(true);
            }
            if (this.isMe) {
                const localCenter = this.getLocalCenter();
                const origin = this.hands.map(card => {
                    return {
                        zIndex: this.getChildIndex(card),
                    };
                });
                const onComplete = () => {
                    this.hands.forEach((card, index) => {
                        const timeline = gsap.timeline();
                        timeline
                            .to(card, {
                                x: -465 + 63 * index - 60 * (cards.length / 2),
                                ease: 'sina.in',
                                duration: 0.3,
                            })
                            .call(() => {
                                this.setChildIndex(card, origin[index].zIndex);
                                card.flip();
                                if (index === this.hands.length - 1) {
                                    resolve(true);
                                }
                            });
                    });
                };
                this.hands.forEach((card, index) => {
                    const timeline = gsap.timeline();
                    timeline
                        .call(() => {
                            card.flip();
                        })
                        .to(card, {
                            x: localCenter.x - card.width / 2,
                            ease: 'sina.in',
                            duration: 0.3,
                        })
                        .call(() => {
                            if (index === this.hands.length - 1) {
                                this.hands.sort((a, b) => {
                                    const aV = a.value;
                                    const bV = b.value;
                                    return compareFn(
                                        isNaN(+aV) ? aV : +aV,
                                        isNaN(+bV) ? bV : +bV
                                    );
                                });
                                console.log(
                                    this.hands.map(item => item.value),
                                    '排序后手牌'
                                );
                                onComplete();
                            }
                        });
                });
            }
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
        this.bidLabel.text = this.callButton.text || '叫地主';
        if (!this.bidLabel.visible) {
            this.bidLabel.visible = true;
        }
        this.eventManager.emit('call-landlord', this);
    }

    private handleNoCallButtonClick() {
        if (!this.isMe) return;
        this.hideCallButtons();
        this.bidLabel.text = this.noCallButton.text || '不叫';
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

    public bidLandlord(landlord?: Player | null) {
        if (!this.isMe) {
            // const bid = Math.random() < 0.5;
            const bid = false;
            this.isBid = bid;
            this.bidLabel.text = bid
                ? landlord
                    ? '抢地主'
                    : '叫地主'
                : landlord
                ? '不抢'
                : '不叫';
            if (!this.bidLabel.visible) {
                this.bidLabel.visible = true;
            }
            this.eventManager.emit(
                bid ? 'call-landlord' : 'no-call-landlord',
                this
            );
        } else {
            this.callButton.text = landlord ? '抢地主' : '叫地主';
            this.noCallButton.text = landlord ? '不抢' : '不叫';
            this.showCallButtons();
        }
    }

    public play(currentHand: Card[]) {
        if (this.isMe) {
            this.hands.forEach(card => {
                card.setInteractive(true);
            });
            this.showPlayButtons();
        } else {
            const lhands = findLargestHand(
                currentHand.map(c => ({ color: c.color, value: c.value })),
                this.hands.map(c => ({ color: c.color, value: c.value }))
            );
            console.log(lhands, '非玩家出牌');
            if (lhands.length > 0) {
            } else {
            }
        }
    }

    private hidePlayedCards() {
        this.hands.forEach(card => {
            if (card.isPlayed) {
                card.alpha = 0;
            }
        });
    }

    public async sendCards() {
        this.hidePlayedCards();
        this.hidePlayButtons();
        const actions: any[] = [];
        const lastActions: any[] = [];
        this.hands.forEach(card => {
            card.setInteractive(false);
            if (!card.isPlayed && card.isSelect) {
                card.isPlayed = true;
                actions.push((index: number, cards: any[]) => {
                    gsap.to(card, {
                        x: 63 * index - 60 * (cards.length / 2),
                        y: -120,
                        duration: 0.3,
                        ease: 'sine.out',
                    });
                });
            } else {
                lastActions.push((index: number, cards: any[]) => {
                    gsap.to(card, {
                        x: 63 * index - 60 * (cards.length / 2),
                        y: 0,
                        duration: 0.3,
                        ease: 'sine.out',
                    });
                });
            }
        });
        return await Promise.all([
            ...actions.map((action, index) => action(index, actions)),
            ...lastActions.map((action, index) => action(index, lastActions)),
        ]);
    }

    public isHandsEmpty() {
        return this.hands.every(card => card.isPlayed);
    }

    public getSelectCards() {
        return this.hands.filter(card => card.isSelect && !card.isPlayed);
    }

    public setUnSelectCards() {
        this.hands
            .filter(card => card.isSelect && !card.isPlayed)
            .forEach(card => {
                card.switchSelect();
            });
    }
}
