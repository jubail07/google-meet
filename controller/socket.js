
const rooms = {};

function socketController(io) {
    io.on('connection', (socket) => {
        console.log('New socket connected:', socket.id);

        socket.on('join', (roomId) => {
            socket.join(roomId);
            if (!rooms[roomId]) {
                rooms[roomId] = [];
            }
            rooms[roomId].push(socket.id);

            const otherUsers = rooms[roomId].filter(id => id !== socket.id);
            socket.emit('all-users', otherUsers);

            socket.to(roomId).emit('user-joined', socket.id);

            socket.on('offer', ({ to, from, offer }) => {
                io.to(to).emit('offer', { from, offer });
            })

            socket.on('answer', ({ to, from, answer }) => {
                io.to(to).emit('answer', { from, answer });
            })

            socket.on('ice-candidate', ({ to, from, candidate }) => {
                io.to(to).emit('ice-candidate', { from, candidate });
            })

            socket.on('disconnect', () => {
                if (rooms[roomId]) {
                    rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
                    socket.to(roomId).emit('user-left', socket.id);
                    if (rooms[roomId].length === 0) {
                        delete rooms[roomId];
                    }
                }
            })
        })

        socket.on('chat', (msg) => {
            io.emit('chat', msg)
        })

        socket.on('disconnect', () => {
            console.log('User disconnected');
        })
    })
}

module.exports = socketController;
