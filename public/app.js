import Deck from "../deck.js"

const middleDeckElement = document.querySelector('.middle-deck')
const enemyDeckElement = document.querySelector(".computer-deck")
const userDeckElement = document.querySelector(".user-deck")
const dataElement = document.querySelector(".data")
const dealButton = document.querySelector('#dealbutton')
const multiPlayerButton = document.querySelector('#multiplayerbutton')
const readyButton = document.querySelector('#readybutton')

let userDeck, enemyDeck, middleDeck, stop, canSlap, dealtCards
let currentPlayer = 'user'
let playerNum = 0
let ready = false
let enemyReady = false
let canDeal=false

multiPlayerButton.addEventListener('click', startMultiPlayer)

function startMultiPlayer() {
    multiPlayerButton.removeEventListener('click', startMultiPlayer)
    const socket = io();

    socket.on('player-number', num => {
        if(num===-1) {
            dataElement.innerHTML = "Sorry, the server is full"
        }
        else {
            playerNum = parseInt(num)
            if(playerNum===1) currentPlayer = "enemy"

        console.log(playerNum)

        socket.emit('check-players')
        }
    })

    socket.on('player-connection', num => {
        console.log(`Player number ${num} connected/disconnected`)
        playerConnectedOrDisconnected(num)
    })
    
    socket.on('enemy-ready', num => {
        enemyReady = true;
        playerReady(num)
        if(ready) playGameMulti(socket)
    })

    socket.on('not-ready', num => {
        notReady(num)
        notReady(playerNum)
        socket.emit('not-ready')
    })

    socket.on('check-players', players => {
        players.forEach((p, i) => {
          if(p.connected){
            playerConnectedOrDisconnected(i)
          } 
          if(p.ready) {
            playerReady(i)
            if(i !== playerReady) enemyReady = true
          }
        })
    })

    socket.on('timeout', () => {
        dataElement.innerHTML = 'You have reached the 10 minute limit'
    })

    socket.on("player-0-deck", deck=> {
        enemyDeck = new Deck(JSON.parse(deck).cards.slice(0, deck.numberOfCards))
        dealtCards = true
    }) 
    
    socket.on("player-1-deck", deck=> {
        userDeck = new Deck(JSON.parse(deck).cards.slice(0, deck.numberOfCards))
        middleDeck = new Deck()
        middleDeck.clear()
        updateData()
    }) 

    socket.on('flipped', () => {
        flipCard(socket)
        currentPlayer="user"
        updateData()
    }) 

    socket.on('slapped', () => {
        checkTopCard()
        checkSlap(socket, enemyDeck)
        updateData()
    })

    readyButton.addEventListener('click', () => {
        if(dealtCards) {playGameMulti(socket)}
        else dataElement.innerHTML = "Please deal"
    })

    dealButton.addEventListener('click', () =>{
        if(canDeal) {
            setUp(socket)
            updateData()
        }
        else{dataElement.innerHTML='No enemy connected'}
    })
    
    document.getElementById("userdeck").addEventListener("click", () => {
        if(ready && enemyReady) {
            stop = false
        }
        if (stop) {
            return
        }
        if(currentPlayer!=='user' || !ready || !enemyReady) {
            return
        }
        flipCard(socket)
    })
    
    document.getElementById("middledeck").addEventListener("click", () => {
        if(ready && enemyReady) {
            stop = false
        }
        if (stop && (!ready || !enemyReady)) {
            return
        }
        checkSlap(socket, userDeck)
    })

    function playerConnectedOrDisconnected(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .connected span`).classList.toggle('green')
        if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
        else{
            canDeal=true
        }
    }
}

function setUp(socket) {
    if(!dealtCards) {
        const deck = new Deck()
        deck.shuffle()
        const deckMidpoint = Math.ceil(deck.numberOfCards / 2)
        userDeck = new Deck(deck.cards.slice(0, deckMidpoint))
        enemyDeck = new Deck(deck.cards.slice(deckMidpoint, deck.numberOfCards))
        middleDeck = new Deck()
        middleDeck.clear()
        socket.emit("player-0-deck", JSON.stringify(userDeck))
        socket.emit("player-1-deck",JSON.stringify(enemyDeck))
        dealtCards=true
    }
}

function flipCard(socket) {
    if(currentPlayer=='user') {
        const userCard = userDeck.pop()
        middleDeck.push(userCard)
        middleDeckElement.innerHTML = userCard
        updateData()
        currentPlayer='enemy'
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
    if(middleDeck.numberOfCards == 0) {canSlap=true}

    else if(canSlap = middleDeck.findCard(middleDeck.numberOfCards).charAt(0)=="J") {canSlap = true}

    else if(middleDeck.numberOfCards>1 && middleDeck.findCard(middleDeck.numberOfCards).charAt(0)==middleDeck.findCard(middleDeck.numberOfCards-1).charAt(0)) {canSlap = true}

    else if(middleDeck.findCard(middleDeck.numberOfCards).charAt(0)==middleDeck.findCard(1).charAt(0) && middleDeck.numberOfCards>=3) {canSlap = true}
}

function checkSlap(socket, deck) {
    checkTopCard()
    if(canSlap) {
        addDeck(deck)
    }
    else {
        middleDeck.unshift(deck.pop())
        if(isGameOver(deck)) {
            updateData()
            return
        }
        
    }
    if(deck==userDeck) {
        socket.emit('slapped')
    }
    updateData()
}

function addDeck(deck) {
    if (canSlap) {
        for(let i = 0; i < middleDeck.numberOfCards;) {
            deck.push(middleDeck.pop())
        }
        updateData()
        middleDeckElement.innerHTML = ""
    } 
}

function updateData() {
    if(isGameOver(enemyDeck)||isGameOver(userDeck)) {
        console.log('reached')
        stopGame()
    }
    enemyDeckElement.innerText = enemyDeck.numberOfCards
    userDeckElement.innerText = userDeck.numberOfCards
    if(currentPlayer=='user') {
        dataElement.innerText='Your turn'
    }
    else {
        dataElement.innerText='Enemy turn'
    }
    dataElement.appendChild(document.createElement("br"));
    dataElement.append("Number of cards in stack: "+middleDeck.numberOfCards)
    dataElement.appendChild(document.createElement("br"));
    dataElement.append("Bottom card: ")
    if (middleDeck.numberOfCards>0) {
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
    middleDeckElement.innerHTML='Game Over'
    if(isGameOver(userDeck)) {
        userDeckElement.innerHTML='Lose'
        enemyDeckElement.innerHTML='Win'
    }
    else {
        userDeckElement.innerHTML='Win'
        enemyDeckElement.innerHTML='Lose'
    }
}

function playGameMulti(socket) {
    if(!ready) {
        socket.emit('player-ready')
        ready = true
        playerReady(playerNum)
    }
}

function playerReady(num) {
    let player = `.p${parseInt(num)+1}`
    document.querySelector(`${player} .ready span`).classList.toggle('green')
}

function notReady(num) {
    userDeckElement.innerHTML=''
    enemyDeckElement.innerHTML=''
    middleDeckElement.innerHTML=''
    if(playerNum==0) {currentPlayer='user'}
    else{currentPlayer='enemy'}
    userDeck, enemyDeck, middleDeck, stop, canSlap=null
    dealtCards=false
    ready=false
    enemyReady=false
    stop=true
    let player = `.p${parseInt(num)+1}`
    document.querySelector(`${player} .ready span`).classList.remove('green')
}