const SUITS = ["♠" , "♣", "♥", "♦"]
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
export default class Deck {
    constructor(cards=newDeck()) {
        this.cards = cards
    }
    get numberOfCards() {
        if(this.cards.length <0) return 0;
        return this.cards.length
    }

    findCard(i) {
        
        return this.cards[i-1]
    }

    clear() {
        this.cards = []
    }

    pop() {
        return this.cards.shift()
    }

    push(card) {
        this.cards.push(card)
    }

    unshift(card) {
        this.cards.unshift(card)
    }

    shuffle() {
        for(let i = this.numberOfCards-1; i > 0; i--) {
            const newIndex = Math.floor(Math.random()*(i+1));
            const oldValue = this.cards[newIndex];
            this.cards[newIndex] = this.cards[i];
            this.cards[i] = oldValue;
        }
    }
}

function newDeck() {
    return SUITS.flatMap(suit => {
        return VALUES.map(value => {
            return value+" "+suit
        })
    })
}