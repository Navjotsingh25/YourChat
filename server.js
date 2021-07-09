const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utls/messages');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utls/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const botName = 'chatbox Bot'
//st static folder
app.use(express.static(path.join(__dirname, 'public')));

//run when clint connects
io.on('connection', socket => {

    socket.on('jointRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //welcomecurrent user
        socket.emit('message', formatMessage(botName, 'Welcome to chatBox'));

        //brodecast whena user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, ` ${user.username} has joined a chat`));

        //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });



    // lissen to chat message
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
        // console.log(msg);
    });

    // runs when client dis connect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} have left the chat`));
            //send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });

        }
    });



});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running at port ${PORT}`));