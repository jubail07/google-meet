require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieparser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server)

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cookieparser())
app.use(express.static('static'))


const { connectDB } = require('./config/database')
connectDB();

// Routes
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
app.use('/', authRoute, userRoute);

// 🔌 WebRTC Signaling with Socket.IO
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined');
    });

    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.room).emit('ice-candidate', data.candidate);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});


const port = process.env.PORT || 4000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
