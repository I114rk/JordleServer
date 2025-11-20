const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

// Читаем словарь
const DICTIONARY = require('./words.json'); 

// ⚠️ ПРОВЕРКА СЛОВАРЯ: Убеждаемся, что все слова состоят из 5 букв
const validWords = DICTIONARY.filter(entry => entry.word.length === 5);
if (DICTIONARY.length !== validWords.length) {
    console.error("⚠️ ВНИМАНИЕ: Словарь содержит слова, не состоящие из 5 букв. Они будут игнорироваться.");
}

// 1. Состояние для текущего секретного слова
let currentSecretEntry = null;

// Функция для выбора и установки нового случайного слова
function selectNewSecretWord() {
    // Выбираем только из валидных 5-буквенных слов
    currentSecretEntry = validWords[Math.floor(Math.random() * validWords.length)];
    return {
        word: currentSecretEntry.word,
        desc: currentSecretEntry.desc
    };
}

// Инициализируем первое слово при старте сервера
selectNewSecretWord();

console.log(`[DEBUG] Секретное слово: ${currentSecretEntry.word}`); 


// ===========================================
// НОВЫЙ ЭНДПОИНТ: Получение всего словаря для вкладки
// ===========================================
app.get('/dictionary', (req, res) => {
    // Возвращаем только валидные 5-буквенные слова
    res.json(validWords); 
});

// ЭНДПОИНТ: Сброс игры
app.get('/new-game', (req, res) => {
    selectNewSecretWord();
    console.log(`[DEBUG] Секретное слово сброшено: ${currentSecretEntry.word}`); 
    res.json({ success: true }); 
});

// Эндпоинт проверки слова
app.post('/check-word', (req, res) => {
    const userGuess = (req.body.guess || '').toUpperCase();
    const attemptNumber = req.body.attemptNumber || 0;

    if (!userGuess || userGuess.length !== 5) {
        return res.status(400).json({ error: 'Слово должно состоять из 5 букв' });
    }
    
    // 2. ВАЛИДАЦИЯ: Проверяем, есть ли слово в словаре
    const isGuessAllowed = validWords.some(entry => entry.word === userGuess);
    
    if (!isGuessAllowed) {
        return res.status(400).json({ error: 'НЕТ ТАКОГО ЖАРГОНИЗМА В СЛОВАРЕ ИГРЫ' });
    }

    const secretWord = currentSecretEntry.word; 

    const result = new Array(5).fill(0); 
    const secretChars = secretWord.split('');
    const guessChars = userGuess.split('');

    // ... (Логика проверки: ЗЕЛЕНЫЕ/ЖЕЛТЫЕ) ...
    guessChars.forEach((char, i) => {
        if (char === secretChars[i]) {
            result[i] = 2;
            secretChars[i] = null; 
            guessChars[i] = null; 
        }
    });

    guessChars.forEach((char, i) => {
        if (char !== null) { 
            const foundIndex = secretChars.indexOf(char);
            if (foundIndex !== -1) {
                result[i] = 1;
                secretChars[foundIndex] = null; 
            }
        }
    });

    const isWin = result.every(val => val === 2);
    const isGameOver = isWin || attemptNumber >= 5;

    res.json({
        mask: result,
        isWin: isWin,
        isGameOver: isGameOver,
        solution: isGameOver ? currentSecretEntry : null
    });
});

app.listen(port, () => {
    console.log(`Jordle сервер запущен на http://localhost:${port}`);
});