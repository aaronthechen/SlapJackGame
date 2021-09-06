const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

let users = []

io.on('connection', socket => {
  let room, playerIndex, usersInRoom
  socket.on('join-room', roomid => {
    const user = {id: socket.id, room: roomid}
    users.push(user)
    usersInRoom = users.filter(user => user.room === roomid).length
    if(usersInRoom>2 || roomid=='' || roomid==null) {
      const index = users.indexOf(user);
      if (index > -1) {
      users.splice(index, 1);
      io.sockets.to(socket.id).emit('cannot-join')
      return
      }
    }
    socket.join(roomid)
    room = roomid
    playerIndex = usersInRoom===1 ? 1 : 2
    console.log(`Player ${playerIndex} connected`)
    io.to(socket.id).emit('player-number', playerIndex)
    if(playerIndex==2){io.sockets.to(room).emit('player-connection', 1)}
    io.sockets.to(room).emit('player-connection', playerIndex)
  })

  socket.on('disconnect', () => {
    io.sockets.in(room).emit('player-disconnect', playerIndex)
    console.log(`Player ${playerIndex} disconnected`)

    playerIndex = usersInRoom===1 ? 1 : 2
    console.log(`Player became ${playerIndex}`)
    io.to(room).emit('player-change')

    const removeIndex = users.findIndex(user => user.id === socket.id)
    if(removeIndex!==-1)
        return users.splice(removeIndex, 1)[0]
  })

  socket.on("player-decks", ({ userD, enemyD }) => {
    socket.to(room).emit("player-decks", {userD, enemyD})
  })

  socket.on('flipped', () => {
    socket.to(room).emit('flipped')
  })

  socket.on('slapped', () => {
    socket.to(room).emit('slapped')
  })
})