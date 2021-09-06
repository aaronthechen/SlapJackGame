import Deck from "../deck.js"

const roomCode = document.querySelector('.room-code')
const middleDeckElement = document.querySelector('.middle-deck')
const enemyDeckElement = document.querySelector(".computer-deck")
const userDeckElement = document.querySelector(".user-deck")
const dataElement = document.querySelector(".data")
const dealButton = document.querySelector('#deal')
const userButton = document.getElementById("userdeck")
const middleButton = document.getElementById("middledeck")

let userDeck, enemyDeck, middleDeck, stop, canSlap, dealtCards, slapped
let roomid = prompt("room: ")
let currentPlayer = 'user'
let playerNum = 1
let connected = false
let enemyConnected = false

const socket = io();

socket.emit('join-room', roomid)

socket.on('cannot-join', () => {
    roomid = prompt('error, try another room:')
    socket.emit('join-room', roomid)
})

socket.on('player-number', num => {
    playerNum = parseInt(num)
    if (playerNum === 2) {currentPlayer = "enemy"}
    else {currentPlayer='user'}
    playerConnected(num)
    roomCode.append(roomid)
})

socket.on('player-change', () => {
    playerNum=1
    currentPlayer='user'
    playerConnected(playerNum)
})

socket.on('player-connection', num => {
    console.log(`Player number ${num} connected`)
    playerConnected(num)
    dealtCards=!(connected && enemyConnected)
})

socket.on('player-disconnect', num => {
    console.log(`Player number ${num} disconnected`)
    playerDisconnected(num)
    stopGame()
    middleDeckElement.innerHTML = ''
})

socket.on("player-decks", ({ userD, enemyD }) => {
    userDeck = new Deck(JSON.parse(userD).cards.slice(0, userD.numberOfCards))
    enemyDeck = new Deck(JSON.parse(enemyD).cards.slice(0, userD.numberOfCards))
    middleDeck = new Deck()
    middleDeck.clear()
    updateData()
    dealtCards = true
    stop = false
})

socket.on('flipped', () => {
    flipCard(socket)
    currentPlayer = "user"
    updateData()
})

socket.on('slapped', () => {
    checkTopCard()
    checkSlap(socket, enemyDeck)
    updateData()
})

dealButton.addEventListener('click', ()=> {
    if(connected && enemyConnected) {
        stop = false
        setUp(socket)
    }
})

userButton.addEventListener("click", () => {
    if (stop) {
        console.log('here')
        return
    }
    if (currentPlayer !== 'user') {
        return
    }
    flipCard(socket)
    slapped = false
})

middleButton.addEventListener("click", () => {
    if (stop) {
        return
    }
    if (connected && enemyConnected) {
        checkSlap(socket, userDeck)
    }
})

function playerConnected(num) {
    let player = `.p${parseInt(num)}`
    document.querySelector(`${player} .connected span`).classList.add('green')
    if (parseInt(num) === playerNum) {
        connected=true
        document.querySelector(player).style.fontWeight = 'bold'
    }
    else {
        enemyConnected=true
    }
}

function playerDisconnected() {
    enemyConnected=false
    let player = `.p${parseInt(2)}`
    document.querySelector(`${player} .connected span`).classList.remove('green')
    document.querySelector(player).style.fontWeight = 'normal'
}

function setUp(socket) {
    if (!dealtCards && !stop) {
        const deck = new Deck()
        deck.shuffle()
        const deckMidpoint = Math.ceil(deck.numberOfCards / 2)
        userDeck = new Deck(deck.cards.slice(0, deckMidpoint))
        enemyDeck = new Deck(deck.cards.slice(deckMidpoint, deck.numberOfCards))
        middleDeck = new Deck()
        middleDeck.clear()
        socket.emit("player-decks", {
            userD: JSON.stringify(enemyDeck),
            enemyD: JSON.stringify(userDeck)
        })
        dealtCards = true
        updateData()
    }
}

function flipCard(socket) {
    slapped = false
    if (currentPlayer == 'user') {
        const userCard = userDeck.pop()
        middleDeck.push(userCard)
        middleDeckElement.innerHTML = userCard
        updateData()
        currentPlayer = 'enemy'
        socket.emit('flipped')
    }
    else {
        const enemyCard = enemyDeck.pop()
        middleDeck.push(enemyCard)
        middleDeckElement.innerHTML = enemyCard
    }
    updateData()
}

function checkTopCard() {
    if (middleDeck.numberOfCards == 0) { canSlap = true }

    else if (canSlap = middleDeck.findCard(middleDeck.numberOfCards).charAt(0) == "J") { canSlap = true }

    else if (middleDeck.numberOfCards > 1 && middleDeck.findCard(middleDeck.numberOfCards).charAt(0) == middleDeck.findCard(middleDeck.numberOfCards - 1).charAt(0)) { canSlap = true }

    else if (middleDeck.findCard(middleDeck.numberOfCards).charAt(0) == middleDeck.findCard(1).charAt(0) && middleDeck.numberOfCards >= 3) { canSlap = true }
}

function checkSlap(socket, deck) {
    if (slapped) return
    checkTopCard()
    if (canSlap) {
        addDeck(deck)
    }
    else {
        middleDeck.unshift(deck.pop())
        if (isGameOver(deck)) {
            updateData()
            return
        }

    }
    if (deck == userDeck) {
        socket.emit('slapped')
    }
    updateData()
    slapped = true
}

function addDeck(deck) {
    if (canSlap) {
        for (let i = 0; i < middleDeck.numberOfCards;) {
            deck.push(middleDeck.pop())
        }
        updateData()
        middleDeckElement.innerHTML = ""
    }
}

function updateData() {
    if (isGameOver(enemyDeck) || isGameOver(userDeck)) {
        stopGame()
    }
    enemyDeckElement.innerText = enemyDeck.numberOfCards
    userDeckElement.innerText = userDeck.numberOfCards
    if (currentPlayer == 'user') {
        dataElement.innerText = 'Your turn'
    }
    else {
        dataElement.innerText = 'Enemy turn'
    }
    dataElement.appendChild(document.createElement("br"));
    dataElement.append("Number of cards in stack: " + middleDeck.numberOfCards)
    dataElement.appendChild(document.createElement("br"));
    dataElement.append("Bottom card: ")
    if (middleDeck.numberOfCards > 0) {
        dataElement.append(middleDeck.findCard(1))
    }
    else {
        dataElement.append(0)
    }
}

function isGameOver(deck) {
    return deck.numberOfCards === 0
}

function stopGame() {
    stop = true
    middleDeckElement.innerHTML = 'Game over'
    userDeckElement.innerHTML = ''
    enemyDeckElement.innerHTML = ''
    dataElement.innerHTML=''
}