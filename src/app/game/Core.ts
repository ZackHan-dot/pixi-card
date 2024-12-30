import { CardColor, CardModel, NormalCard, SpecialCard } from './Card';
import { CardType } from './const';

export type CardValue = Array<number | 'w1' | 'w2'>;

const compareFn = (a: number | string, b: number | string) => {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b; // 数字之间按升序排序
    } else if (typeof a === 'string' && typeof b === 'string') {
        if (a === 'w1' && b === 'w2') {
            return -1; // 'w1' 在 'w2' 之前
        } else if (a === 'w2' && b === 'w1') {
            return 1; // 'w2' 在 'w1' 之后
        } else {
            return a.localeCompare(b); // 其他字符串按字典序排序
        }
    } else if (typeof a === 'number') {
        return -1; // 数字在字符串之前
    } else {
        return 1; // 字符串在数字之后
    }
};
export function judgeTwoHands(hands: CardValue) {
    if (hands.length !== 2) {
        return false;
    }
    return new Set(hands).size === 1;
}

export function judgeRocket(hands: CardValue) {
    if (hands.length !== 2) {
        return false;
    }
    hands.sort(compareFn);
    return hands[0] === 'w1' && hands[1] === 'w2';
}

export function judgeThreehands(hands: CardValue) {
    if (hands.length !== 3) {
        return false;
    }
    return new Set(hands).size === 1;
}

export function judgeBomb(hands: CardValue) {
    if (hands.length !== 4) {
        return false;
    }
    return new Set(hands).size === 1;
}

export function judgeThreeOne(hands: CardValue) {
    if (hands.length !== 4) {
        return false;
    }
    hands.sort(compareFn);
    return (
        (hands[0] === hands[1] &&
            hands[1] === hands[2] &&
            hands[2] !== hands[3]) ||
        (hands[1] === hands[2] &&
            hands[2] === hands[3] &&
            hands[0] !== hands[1])
    );
}

export function judgeThreeTwo(hands: CardValue) {
    if (hands.length !== 5) {
        return false;
    }
    const countMap: Record<string, number> = {};
    for (const card of hands) {
        countMap[card] = (countMap[card] || 0) + 1;
    }
    const values = Object.values(countMap);
    const hasThree = values.includes(3);
    const hasTwo = values.includes(2);
    const hasJokers = countMap['w1'] === 1 && countMap['w2'] === 1;
    return hasThree && (hasTwo || hasJokers);
}

export function judgeStraight(hands: CardValue) {
    if (hands.length < 5) {
        return false;
    }
    if (hands.includes(15) || hands.includes('w1') || hands.includes('w2')) {
        return false;
    }
    hands.sort(compareFn);
    for (let i = 1; i < hands.length; i++) {
        if (hands[i] !== (hands[i - 1] as number) + 1) {
            return false;
        }
    }
    return true;
}

export function judgeFourTwo(hands: CardValue) {
    if (hands.length !== 6) {
        return false;
    }
    const countMap: Record<string, number> = {};
    for (const card of hands) {
        countMap[card] = (countMap[card] || 0) + 1;
    }
    const values = Object.values(countMap);
    return values.includes(4);
}

export function judgeConsecutivePairs(hands: CardValue) {
    if (hands.length < 6 || hands.length % 2 !== 0) {
        return false;
    }
    if (hands.includes(15) || hands.includes('w1') || hands.includes('w2')) {
        return false;
    }
    hands.sort(compareFn);
    for (let i = 0; i < hands.length; i += 2) {
        if (
            hands[i] !== hands[i + 1] ||
            (i > 0 && hands[i] !== (hands[i - 2] as number) + 1)
        ) {
            return false;
        }
    }
    return true;
}

export function judgePlane(hands: CardValue) {
    if (hands.length < 6 || hands.length % 3 !== 0) {
        return false;
    }
    if (hands.includes(15) || hands.includes('w1') || hands.includes('w2')) {
        return false;
    }
    hands.sort(compareFn);
    for (let i = 0; i < hands.length; i += 3) {
        if (
            hands[i] !== hands[i + 1] ||
            hands[i] !== hands[i + 2] ||
            (i > 0 && hands[i] !== (hands[i - 3] as number) + 1)
        ) {
            return false;
        }
    }
    return true;
}

export function judgePlaneWithWings(hands: CardValue) {
    const withOne = hands.length % 4 === 0;
    const withTwo = hands.length % 5 === 0;
    if (hands.length < 8 || !(withOne || withTwo)) {
        return false;
    }
    const countMap: Record<string, number> = {};
    for (const card of hands) {
        countMap[card] = (countMap[card] || 0) + 1;
    }
    const mains = [];
    const remains = [];
    for (const key in countMap) {
        if (countMap[key] === 4) {
            mains.push(key);
            remains.push(key);
        } else if (countMap[key] === 3) {
            mains.push(key);
        } else {
            const len = countMap[key];
            for (let i = 0; i < len; i++) {
                remains.push(key);
            }
        }
    }
    if (withOne) {
        return mains.length === remains.length;
    } else if (withTwo) {
        return mains.length === new Set(remains).size;
    }
    return false;
}

export function judgeCardType(hands: CardValue): CardType {
    if (judgeRocket(hands)) {
        return CardType.ROCKET;
    } else if (judgeBomb(hands)) {
        return CardType.BOMB;
    } else if (judgePlaneWithWings(hands)) {
        return CardType.AIRPLANE_WITH_ONE;
    } else if (judgePlane(hands)) {
        return CardType.AIRPLANE;
    } else if (judgeFourTwo(hands)) {
        return CardType.FOUR_WITH_TWO;
    } else if (judgeThreeTwo(hands)) {
        return CardType.THREE_WITH_TWO;
    } else if (judgeConsecutivePairs(hands)) {
        return CardType.PAIR_SEQUENCE;
    } else if (judgeStraight(hands)) {
        return CardType.STRAIGHT;
    } else if (judgeThreeOne(hands)) {
        return CardType.THREE_WITH_ONE;
    } else if (judgeThreehands(hands)) {
        return CardType.THREE;
    } else if (judgeTwoHands(hands)) {
        return CardType.PAIR;
    } else if (hands.length === 1) {
        return CardType.SINGLE;
    } else {
        return CardType.INVALID;
    }
}

function compareCards(card1: number | string, card2: number | string): number {
    if (typeof card1 === 'string' && typeof card2 === 'string') {
        if (card1 === 'w1' && card2 === 'w2') return -1;
        if (card1 === 'w2' && card2 === 'w1') return 1;
        return card1.localeCompare(card2);
    }
    if (typeof card1 === 'number' && typeof card2 === 'number') {
        return card1 - card2;
    }
    if (typeof card1 === 'number') return -1;
    return 1;
}

function compareHandsByType(
    hands1: CardValue,
    hands2: CardValue,
    type: CardType
): number {
    switch (type) {
        case CardType.ROCKET:
            return 0; // 火箭相等
        case CardType.BOMB:
            return compareBombs(hands1, hands2);
        case CardType.AIRPLANE_WITH_ONE:
        case CardType.AIRPLANE_WITH_TWO:
        case CardType.AIRPLANE:
            return comparePlanes(hands1, hands2);
        case CardType.FOUR_WITH_TWO:
        case CardType.FOUR_WITH_ONE:
            return compareFourWithWings(hands1, hands2);
        case CardType.THREE_WITH_TWO:
        case CardType.THREE_WITH_ONE:
            return compareThreeWithWings(hands1, hands2);
        case CardType.STRAIGHT:
            return compareStraights(hands1, hands2);
        case CardType.PAIR_SEQUENCE:
            return comparePairSequences(hands1, hands2);
        case CardType.THREE:
            return compareThrees(hands1, hands2);
        case CardType.PAIR:
            return comparePairs(hands1, hands2);
        case CardType.SINGLE:
            return compareSingles(hands1, hands2);
        default:
            return 0;
    }
}

function compareBombs(hands1: CardValue, hands2: CardValue): number {
    if (hands1.length !== 4 || hands2.length !== 4) {
        throw new Error('Invalid bomb hands');
    }
    const card1 = hands1[0];
    const card2 = hands2[0];
    return compareCards(card1, card2);
}

function comparePlanes(hands1: CardValue, hands2: CardValue): number {
    const countMap1 = getCountMap(hands1);
    const countMap2 = getCountMap(hands2);

    const mains1 = getMains(countMap1);
    const mains2 = getMains(countMap2);

    if (mains1.length !== mains2.length) {
        throw new Error('Invalid plane hands');
    }

    const sortedMains1 = customSort(mains1);
    const sortedMains2 = customSort(mains2);

    for (let i = 0; i < sortedMains1.length; i++) {
        const result = compareCards(sortedMains1[i], sortedMains2[i]);
        if (result !== 0) {
            return result;
        }
    }

    return 0;
}

function compareFourWithWings(hands1: CardValue, hands2: CardValue): number {
    const countMap1 = getCountMap(hands1);
    const countMap2 = getCountMap(hands2);

    const four1 = getFour(countMap1);
    const four2 = getFour(countMap2);

    if (four1.length !== 4 || four2.length !== 4) {
        throw new Error('Invalid four with wings hands');
    }

    const card1 = four1[0];
    const card2 = four2[0];

    return compareCards(card1, card2);
}

function compareThreeWithWings(hands1: CardValue, hands2: CardValue): number {
    const countMap1 = getCountMap(hands1);
    const countMap2 = getCountMap(hands2);

    const three1 = getThree(countMap1);
    const three2 = getThree(countMap2);

    if (three1.length !== 3 || three2.length !== 3) {
        throw new Error('Invalid three with wings hands');
    }

    const card1 = three1[0];
    const card2 = three2[0];

    return compareCards(card1, card2);
}

function compareStraights(hands1: CardValue, hands2: CardValue): number {
    const sortedHands1 = customSort(hands1);
    const sortedHands2 = customSort(hands2);

    if (sortedHands1.length !== sortedHands2.length) {
        throw new Error('Invalid straight hands');
    }

    return compareCards(sortedHands1[0], sortedHands2[0]);
}

function comparePairSequences(hands1: CardValue, hands2: CardValue): number {
    const sortedHands1 = customSort(hands1);
    const sortedHands2 = customSort(hands2);

    if (sortedHands1.length !== sortedHands2.length) {
        throw new Error('Invalid pair sequence hands');
    }

    for (let i = 0; i < sortedHands1.length; i += 2) {
        const result = compareCards(sortedHands1[i], sortedHands2[i]);
        if (result !== 0) {
            return result;
        }
    }

    return 0;
}

function compareThrees(hands1: CardValue, hands2: CardValue): number {
    const countMap1 = getCountMap(hands1);
    const countMap2 = getCountMap(hands2);

    const three1 = getThree(countMap1);
    const three2 = getThree(countMap2);

    if (three1.length !== 3 || three2.length !== 3) {
        throw new Error('Invalid three hands');
    }

    const card1 = three1[0];
    const card2 = three2[0];

    return compareCards(card1, card2);
}

function comparePairs(hands1: CardValue, hands2: CardValue): number {
    const countMap1 = getCountMap(hands1);
    const countMap2 = getCountMap(hands2);

    const pair1 = getPair(countMap1);
    const pair2 = getPair(countMap2);

    if (pair1.length !== 2 || pair2.length !== 2) {
        throw new Error('Invalid pair hands');
    }

    const card1 = pair1[0];
    const card2 = pair2[0];

    return compareCards(card1, card2);
}

function compareSingles(hands1: CardValue, hands2: CardValue): number {
    if (hands1.length !== 1 || hands2.length !== 1) {
        throw new Error('Invalid single hands');
    }

    return compareCards(hands1[0], hands2[0]);
}

function getCountMap(hands: CardValue): Record<string, number> {
    const countMap: Record<string, number> = {};
    for (const card of hands) {
        countMap[card] = (countMap[card] || 0) + 1;
    }
    return countMap;
}

function getMains(countMap: Record<string, number>): CardValue {
    const mains: CardValue = [];
    for (const key in countMap) {
        if (countMap[key] === 3) {
            mains.push(isNaN(+key) ? (key as 'w1' | 'w2') : parseInt(key));
        }
    }
    return mains;
}

function getFour(countMap: Record<string, number>): CardValue {
    for (const key in countMap) {
        if (countMap[key] === 4) {
            return Array(4).fill(key);
        }
    }
    return [];
}

function getThree(countMap: Record<string, number>): CardValue {
    for (const key in countMap) {
        if (countMap[key] === 3) {
            return Array(3).fill(key);
        }
    }
    return [];
}

function getPair(countMap: Record<string, number>): CardValue {
    for (const key in countMap) {
        if (countMap[key] === 2) {
            return Array(2).fill(key);
        }
    }
    return [];
}

function customSort(hands: CardValue): CardValue {
    return hands.sort(compareFn);
}

export function compareHands(hands1: CardValue, hands2: CardValue): number {
    const type1 = judgeCardType(hands1);
    const type2 = judgeCardType(hands2);

    if (type1 === CardType.INVALID || type2 === CardType.INVALID) {
        throw new Error('Invalid hands');
    }

    if (type1 === type2) {
        return compareHandsByType(hands1, hands2, type1);
    }

    if (type1 === CardType.ROCKET) {
        return 1;
    }
    if (type2 === CardType.ROCKET) {
        return -1;
    }
    if (type1 === CardType.BOMB) {
        return 1;
    }
    if (type2 === CardType.BOMB) {
        return -1;
    }

    return 0; // 不同类型的牌无法比较大小
}

export function generateDeck(): CardModel[] {
    const deck: CardModel[] = [];

    const allColors = Object.values(CardColor).filter(
        color => color !== CardColor.None
    );

    // 添加数字牌
    for (const color of allColors) {
        for (let value = 3; value <= 10; value++) {
            deck.push({ color, value: value });
        }
        deck.push({ color, value: NormalCard.J });
        deck.push({ color, value: NormalCard.Q });
        deck.push({ color, value: NormalCard.K });
        deck.push({ color, value: NormalCard.A });
        deck.push({ color, value: NormalCard.Two });
    }

    // 添加大小王
    deck.push({ color: CardColor.None, value: SpecialCard.LittleJoker });
    deck.push({ color: CardColor.None, value: SpecialCard.BigJoker });

    return deck;
}

export interface InitDeckInfo {
    playerCards: CardModel[][];
    bottomCards: CardModel[];
}
// 洗牌
export function shuffleDeck(deck: CardModel[]): CardModel[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 发牌
export function dealCards(deck: CardModel[]): InitDeckInfo {
    const player1: CardModel[] = [];
    const player2: CardModel[] = [];
    const player3: CardModel[] = [];
    const bottomCards: CardModel[] = [];

    for (let i = 0; i < deck.length; i++) {
        if (i < 17) {
            player1.push(deck[i]);
        } else if (i < 34) {
            player2.push(deck[i]);
        } else if (i < 51) {
            player3.push(deck[i]);
        } else {
            bottomCards.push(deck[i]);
        }
    }

    player1.sort((a, b) => compareFn(a.value, b.value));
    player2.sort((a, b) => compareFn(a.value, b.value));
    player3.sort((a, b) => compareFn(a.value, b.value));

    return { playerCards: [player1, player2, player3], bottomCards };
}

// 生成并洗牌
export function generateRandomHands(): InitDeckInfo {
    const deck = generateDeck();
    const shuffledDeck = shuffleDeck(deck);
    return dealCards(shuffledDeck);
}
