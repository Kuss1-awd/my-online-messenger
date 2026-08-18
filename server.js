const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGO_URI = 'mongodb+srv://kkashircev_db_user:zern0000@cluster0.3yd4dmv.mongodb.net/?appName=Cluster0';
const JWT_SECRET = 'super_secret_key_123';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('=== УСПЕШНО ПОДКЛЮЧЕНО К MONGO_DB ==='))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Модели
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  user: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Заполните поля' });
    const candidate = await User.findOne({ username });
    if (candidate) return res.status(400).json({ error: 'Имя занято' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ username, password: hashedPassword }).save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

io.on('connection', async (socket) => {
  try {
    const history = await Message.find().sort({ timestamp: 1 }).limit(50);
    socket.emit('chat history', history);
  } catch (err) { }

  socket.on('chat message', async (data) => {
    if (data.user && data.text.trim()) {
      try {
        await new Message({ user: data.user, text: data.text }).save();
        io.emit('chat message', data);
      } catch (err) { }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`=== MESSENGER IS RUNNING ON PORT ${PORT} ===`);
});

