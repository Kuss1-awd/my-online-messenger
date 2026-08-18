const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Разрешаем любые входящие подключения (CORS) для безопасности
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Отдаем HTML-страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Слушаем подключения
io.on('connection', (socket) => {
    // Слушаем новые сообщения
    socket.on('chat message', (data) => {
        // Мгновенно рассылаем сообщение ВСЕМ пользователям
        io.emit('chat message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('=== MESSENGER IS RUNNING ON PORT 3000 ===');
});
