// Простой словарь переводов (RU/EN) с выбором языка, сохраняемым в localStorage
const I18N = (() => {
  const dict = {
    ru: {
      app: { title: 'Тренажёры памяти', subtitle: 'Выбери игру, чтобы прокачать память и внимание' },
      common: {
        record: 'Рекорд', playAgain: 'Ещё раз', toMenu: 'В меню', newRecord: ' — новый рекорд!',
        points: '{n} очков', chooseLevel: 'Выбери уровень',
      },
      game: {
        line: { title: 'Строчка', desc: 'Запомни и повтори ряд символов' },
        math: { title: 'Математика', desc: 'Считай быстрее пяти вариантов' },
        pairs: { title: 'Пары', desc: 'Найди все парные карточки по памяти' },
        schulte: { title: 'Таблицы Шульте', desc: 'Находи числа по порядку боковым зрением' },
        stats: { title: 'Статистика', desc: 'Графики прогресса по всем тренажёрам' },
      },
      line: {
        symbolSet: 'Набор символов',
        setEn: 'Английские буквы', setIcons: 'Иконки', setThai: 'Тайский алфавит',
        symbolsInSet: '{n} символов в наборе',
        length: 'Длина строки',
        roundType: 'Тип раунда',
        roundForward: 'Прямой порядок', roundForwardDesc: 'Повтори символы в том же порядке',
        roundReverse: 'Обратный порядок', roundReverseDesc: 'Повтори символы задом наперёд',
        roundGuess: 'Угадай символ', roundGuessDesc: 'Назови символ на отмеченной позиции',
        roundCombo: 'Все раунды', roundComboDesc: 'Одна строка — три испытания подряд: прямой, обратный, угадай',
        start: 'Начать игру',
        phase: 'Этап {i} из {n}: {name}',
        round: 'Раунд {n}',
        gameOver: 'Игра окончена',
        scoreLine: 'Счёт: {score}',
      },
      math: {
        chooseLevel: 'Выбери уровень · {n} вопросов',
        level1: '1 действие', level2: '2 действия', level3: '3 действия со скобками',
        recordN: 'Рекорд: {n}', notPlayed: 'Ещё не пройдено',
        question: 'Вопрос {i} / {n}',
        result: 'Результат',
        correct: 'Верно: {c} / {t} ({pct}%)',
        scoreLine: 'Счёт: {score}',
      },
      pairs: {
        symbolSet: 'Набор символов', setIcons: 'Иконки', setThai: 'Тайский алфавит',
        levelEasy: 'Лёгкий', levelMedium: 'Средний', levelHard: 'Сложный',
        memorizeInfo: 'Запоминание: {s}с, ошибок можно: {m}',
        label: 'Пары',
        mistakes: 'Ошибки: {m} / {allowed}',
        won: 'Все пары найдены!', lost: 'Слишком много ошибок',
        wonInfo: 'Время: {t}, счёт: {s}',
        tryAgain: 'Попробуй ещё раз',
      },
      schulte: {
        levelClassic: 'Классика', levelClassicDesc: 'Сетка неподвижна, смотри в красную точку',
        levelMoving: 'Подвижная сетка', levelMovingDesc: 'После каждого клика все числа перемешиваются',
        levelPeriphery: 'Периферия', levelPeripheryDesc: 'В центре — число, которое нужно найти взглядом',
        recordSuffix: ' · рекорд: {t}',
        mistakes: 'Ошибки: {n}',
        won: 'Таблица пройдена!',
        wonInfo: 'Время: {t} · ошибок: {n}',
      },
      stats: {
        sessions: 'Сессий: {n}',
        playAgain: 'Сыграй ещё раз, чтобы увидеть график',
        last: 'Последний: {v}',
        best: 'Лучший: {v}',
      },
    },
    en: {
      app: { title: 'Memory Trainers', subtitle: 'Pick a game to train your memory and focus' },
      common: {
        record: 'Record', playAgain: 'Play again', toMenu: 'Menu', newRecord: ' — new record!',
        points: '{n} points', chooseLevel: 'Choose a level',
      },
      game: {
        line: { title: 'Sequence', desc: 'Memorize and repeat a row of symbols' },
        math: { title: 'Math', desc: 'Solve faster than the five options' },
        pairs: { title: 'Pairs', desc: 'Find every matching pair from memory' },
        schulte: { title: 'Schulte Tables', desc: 'Find numbers in order using peripheral vision' },
        stats: { title: 'Statistics', desc: 'Progress charts for every trainer' },
      },
      line: {
        symbolSet: 'Symbol set',
        setEn: 'English letters', setIcons: 'Icons', setThai: 'Thai alphabet',
        symbolsInSet: '{n} symbols in the set',
        length: 'Sequence length',
        roundType: 'Round type',
        roundForward: 'Forward order', roundForwardDesc: 'Repeat the symbols in the same order',
        roundReverse: 'Reverse order', roundReverseDesc: 'Repeat the symbols backwards',
        roundGuess: 'Guess the symbol', roundGuessDesc: 'Name the symbol at the marked position',
        roundCombo: 'All rounds', roundComboDesc: 'One sequence — three challenges in a row: forward, reverse, guess',
        start: 'Start game',
        phase: 'Stage {i} of {n}: {name}',
        round: 'Round {n}',
        gameOver: 'Game over',
        scoreLine: 'Score: {score}',
      },
      math: {
        chooseLevel: 'Choose a level · {n} questions',
        level1: '1 operation', level2: '2 operations', level3: '3 operations with brackets',
        recordN: 'Record: {n}', notPlayed: 'Not played yet',
        question: 'Question {i} / {n}',
        result: 'Result',
        correct: 'Correct: {c} / {t} ({pct}%)',
        scoreLine: 'Score: {score}',
      },
      pairs: {
        symbolSet: 'Symbol set', setIcons: 'Icons', setThai: 'Thai alphabet',
        levelEasy: 'Easy', levelMedium: 'Medium', levelHard: 'Hard',
        memorizeInfo: 'Memorize: {s}s, mistakes allowed: {m}',
        label: 'Pairs',
        mistakes: 'Mistakes: {m} / {allowed}',
        won: 'All pairs found!', lost: 'Too many mistakes',
        wonInfo: 'Time: {t}, score: {s}',
        tryAgain: 'Try again',
      },
      schulte: {
        levelClassic: 'Classic', levelClassicDesc: 'The grid is static, focus on the red dot',
        levelMoving: 'Moving grid', levelMovingDesc: 'All numbers shuffle after every click',
        levelPeriphery: 'Periphery', levelPeripheryDesc: 'The center shows the number to find with your eyes',
        recordSuffix: ' · record: {t}',
        mistakes: 'Mistakes: {n}',
        won: 'Table complete!',
        wonInfo: 'Time: {t} · mistakes: {n}',
      },
      stats: {
        sessions: 'Sessions: {n}',
        playAgain: 'Play again to see the chart',
        last: 'Last: {v}',
        best: 'Best: {v}',
      },
    },
  };

  let lang = localStorage.getItem('mt_lang') || 'ru';

  function t(key, vars) {
    const node = key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), dict[lang]);
    let str = node == null ? key : node;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v); });
    return str;
  }
  function getLang() { return lang; }
  function setLang(l) { lang = l; localStorage.setItem('mt_lang', l); }

  return { t, getLang, setLang };
})();
