const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
const io = socket(server)
const users = {}
const socketToRoom = {}

app.use(express.static('public'))

io.on('connection', socket => {
    socket.on('join', roomId => {
        if (users[roomId]) {
            const length = users[roomId].length
            if (length === 2) {
                socket.emit('capacity')
                return
            } else {
                users[roomId].push(socket.id)
            }
        } else {
            users[roomId] = [ socket.id ]
        }
        socketToRoom[socket.id] = roomId
        const roomMembers = users[roomId].filter(id => id !== socket.id)
        socket.emit('list', roomMembers)
    })

    socket.on('sending', data => {
        // console.log('joined', data.recipient);
        io.to(data.recipient).emit('joined', { payload: data.payload, user: data.user, recipient: data.recipient })
    })

    socket.on('returning', data => {
        // console.log('returned', data.recipient);
        io.to(data.recipient).emit('returned', { payload: data.payload, user: socket.id })
    })

    socket.on('disconnect', () => {
        const roomId = socketToRoom[socket.id]
        let room = users[roomId]
        if (room) {
            room = room.filter(id => id !== socket.id)
            users[roomId] = room
            socket.broadcast.emit('disconnected', { user: socket.id })
        }
    })
})

server.listen(process.env.PORT || 8000, () => console.log('server is listening on port 8000'))