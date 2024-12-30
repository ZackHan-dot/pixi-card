import { FancyButton } from '@pixi/ui';
import type { Ticker } from 'pixi.js';
import { Container } from 'pixi.js';
import { engine } from '../../getEngine';
import { PausePopup } from '../../popups/PausePopup';
import { SettingsPopup } from '../../popups/SettingsPopup';
import { GameManager } from '../../game/GameManager';

/** The screen that holds the app */
export class MainScreen extends Container {
    /** Assets bundles required by this screen */
    public static assetBundles = ['main'];

    public mainContainer: Container;
    private pauseButton: FancyButton;
    private settingsButton: FancyButton;
    private paused = false;
    private gameManager: GameManager | null;

    constructor() {
        super();

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);
        this.gameManager = GameManager.getInstance(
            engine().screen,
            this.mainContainer
        );

        const buttonAnimations = {
            hover: {
                props: {
                    scale: { x: 1.1, y: 1.1 },
                },
                duration: 100,
            },
            pressed: {
                props: {
                    scale: { x: 0.9, y: 0.9 },
                },
                duration: 100,
            },
        };
        this.pauseButton = new FancyButton({
            defaultView: 'icon-pause.png',
            anchor: 0.5,
            animations: buttonAnimations,
        });
        this.pauseButton.onPress.connect(() =>
            engine().navigation.presentPopup(PausePopup)
        );
        this.addChild(this.pauseButton);

        this.settingsButton = new FancyButton({
            defaultView: 'icon-settings.png',
            anchor: 0.5,
            animations: buttonAnimations,
        });
        this.settingsButton.onPress.connect(() =>
            engine().navigation.presentPopup(SettingsPopup)
        );
        this.addChild(this.settingsButton);
    }

    /** Prepare the screen just before showing */
    public prepare() {}

    /** Update the screen */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(time: Ticker) {
        if (this.paused) return;
        if (this.gameManager) {
            this.gameManager.update(time);
        }
    }

    /** Pause gameplay - automatically fired when a popup is presented */
    public async pause() {
        this.mainContainer.interactiveChildren = false;
        this.paused = true;
    }

    /** Resume gameplay */
    public async resume() {
        this.mainContainer.interactiveChildren = true;
        this.paused = false;
    }

    /** Fully reset */
    public reset() {
        if (this.gameManager) {
            this.gameManager.deploy();
            this.gameManager = null;
        }
    }

    /** Resize the screen, fired whenever window size changes */
    public resize(width: number, height: number) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.mainContainer.x = centerX;
        this.mainContainer.y = centerY;
        this.pauseButton.x = 30;
        this.pauseButton.y = 30;
        this.settingsButton.x = width - 30;
        this.settingsButton.y = 30;
    }

    /** Show screen with animations */
    public async show(): Promise<void> {
        engine().audio.bgm.play('main/sounds/bgm-main.mp3', { volume: 0.5 });
        if (this.gameManager) {
            this.gameManager.startGame();
        }
    }

    /** Hide screen with animations */
    public async hide() {}

    /** Auto pause the app when window go out of focus */
    public blur() {
        if (!engine().navigation.currentPopup) {
            engine().navigation.presentPopup(PausePopup);
        }
    }
}
