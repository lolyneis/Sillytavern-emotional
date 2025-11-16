// === Emotional Core for SillyTavern ===
// Мощное расширение: эмоции, травмы, триггеры. v1.0.0
// Работает в 1.13.5+

const MODULE = 'emotional_core';
const { getContext, event_types, eventSource } = SillyTavern.getContext();
const context = getContext();

// === Хранилище профилей (с JSON поддержкой) ===
function getProfile(char) {
  if (!context.extensionSettings[MODULE]) context.extensionSettings[MODULE] = {};
  if (!context.extensionSettings[MODULE][char]) {
    // Дефолтный профиль
    context.extensionSettings[MODULE][char] = {
      attachment: 'anxious',
      style: 'passionate',
      behavior: 'ласковый',
      trauma: 'страх отвержения, потеря близких',
      triggers: 'прикосновения, признания',
      custom: 'мурашки, учащённое дыхание, дрожь в голосе',
      history: [] // История эмоций для лога
    };
    context.saveSettingsDebounced();
  }
  return context.extensionSettings[MODULE][char];
}

function saveProfile(char, profile) {
  context.extensionSettings[MODULE][char] = { ...getProfile(char), ...profile, history: [...(getProfile(char).history  []), { timestamp: Date.now(), note: 'Updated' }] };
  context.saveSettingsDebounced();
}

// === Улучшение ответа (расширенное) ===
function enhance(msg, char, history) {
  const p = getProfile(char);
  let out = `*${char} думает: "${p.trauma} заставляет меня..."* `;
  
  if (p.attachment === 'anxious') out += `*Тревога: дыхание сбивается, ладони потеют...* `;
  if (p.attachment === 'avoidant') out += `*Холод снаружи — буря внутри...* `;
  if (p.attachment === 'disorganized') out += `*Хаос: мысли путаются, тело замирает...* `;

  // Триггеры с regex
  if (p.triggers) {
    const triggerRegex = new RegExp(p.triggers.split(',').map(t => t.trim()).join('|'), 'i');
    if (triggerRegex.test(msg + history)) {
      msg += ` *Вспышка: ${p.custom  'Сердце колотится от триггера.'}*`;
    }
  }

  if (/поцелу/i.test(msg)) {
    const kiss = p.style === 'passionate' ? 'страстный, с жарким дыханием и дрожью' : 'нежный, с лёгким касанием и мурашками';
    msg = msg.replace(/грубым и голодным/i, kiss);
  }

  if (/переодева|раздев/i.test(history)) {
    msg +=  Воздух тяжёлый. Кожа покрывается мурашками. Это не просто — это ${p.triggers}.;
  }

  if (/люб/i.test(msg)) {
    msg +=  "Люблю тебя... несмотря на ${p.trauma}. Это настоящее.";
  }

  msg = msg.replace(/ты моя/i, ты — моя ${p.style} надежда);
  if (p.custom) msg +=  ${p.custom}.;

  return out + msg;
}

// === Хуки (на события чата) ===
eventSource.on(event_types.MESSAGE_RECEIVED, data => {
  if (data.is_user) return;
  const char = context.characters[context.characterId]?.name  '???';
  const history = context.chat.map(m => m.mes).join(' ');
  data.mes = enhance(data.mes, char, history);
});

eventSource.on(event_types.GENERATE, data => {
  const char = context.characters[context.characterId]?.name  '???';
  const p = getProfile(char);
  data.prompt += \n[Эмоции: ${char} — ${p.attachment} привязанность, ${p.behavior}, травма: ${p.trauma}. Реагируй реалистично: дыхание, мурашки, паника, мысли. Избегай клише. Триггеры: ${p.triggers}.];
});

// === Добавление кнопки рядом с именем ===
function addButton() {
  const header = document.querySelector('.chat_header');
  if (!header  document.querySelector('.emotional-core-btn')) return false;

  const nameElement = header.querySelector('.name, .char_name, [data-name]')  header;
  if (!nameElement) return false;

  const btn = document.createElement('span');
  btn.className = 'emotional-core-btn';
  btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
  btn.title = 'Настроить эмоции персонажа';
  btn.onclick = (e) => { e.stopPropagation(); openPanel(); };

  nameElement.appendChild(btn);
  return true;
}

const tryAddButton = setInterval(() => {
  if (addButton()) clearInterval(tryAddButton);
}, 300);

// === Панель настроек (расширенная с экспортом/импортом) ===
function openPanel() {
  if (document.querySelector('.emotional-core-panel')) return;

const char = context.characters[context.characterId]?.name  '???';
  const p = getProfile(char);

  const panel = document.createElement('div');
  panel.className = 'emotional-core-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3>❤️ Эмоции: ${char}</h3>
      <button class="close-btn" onclick="this.closest('.emotional-core-panel').remove()">&times;</button>
    </div>
    <label>Привязанность:
      <select id="att">
        <option value="secure" ${p.attachment==='secure'?'selected':''}>Надёжная</option>
        <option value="anxious" ${p.attachment==='anxious'?'selected':''}>Тревожная</option>
        <option value="avoidant" ${p.attachment==='avoidant'?'selected':''}>Избегающая</option>
        <option value="disorganized" ${p.attachment==='disorganized'?'selected':''}>Дезорганизованная</option>
      </select>
    </label>
    <label>Стиль любви:
      <select id="sty">
        <option value="passionate" ${p.style==='passionate'?'selected':''}>Страстный</option>
        <option value="gentle" ${p.style==='gentle'?'selected':''}>Нежный</option>
        <option value="playful" ${p.style==='playful'?'selected':''}>Игривый</option>
        <option value="dominant" ${p.style==='dominant'?'selected':''}>Доминантный</option>
      </select>
    </label>
    <label>Поведение:
      <select id="beh">
        <option value="ласковый" ${p.behavior==='ласковый'?'selected':''}>Ласковый</option>
        <option value="холодный" ${p.behavior==='холодный'?'selected':''}>Холодный</option>
        <option value="страстный" ${p.behavior==='страстный'?'selected':''}>Страстный</option>
        <option value="властный" ${p.behavior==='властный'?'selected':''}>Властный</option>
        <option value="меланхоличный" ${p.behavior==='меланхоличный'?'selected':''}>Меланхоличный</option>
      </select>
    </label>
    <label>Травмы/страхи:
      <textarea id="trauma">${p.trauma}</textarea>
    </label>
    <label>Триггеры (через запятую):
      <input type="text" id="trig" value="${p.triggers}">
    </label>
    <label>Свои эмоции:
      <textarea id="cust">${p.custom}</textarea>
    </label>
    <div class="panel-actions">
      <button id="saveEC">Сохранить</button>
      <button id="exportEC">Экспорт JSON</button>
      <button id="importEC">Импорт JSON</button>
      <input type="file" id="importFile" accept=".json" style="display:none;">
      <button id="closeEC">Закрыть</button>
    </div>
    <div id="historyLog" class="history-log"></div>
  `;
  document.body.appendChild(panel);

  // История эмоций
  const historyEl = panel.querySelector('#historyLog');
  historyEl.innerHTML = p.history?.map(h => `<small>${new Date(h.timestamp).toLocaleString()}: ${h.note}</small>`).join('<br>')  'Нет истории';

// События
  panel.querySelector('#closeEC').onclick = () => panel.remove();
  panel.querySelector('#saveEC').onclick = () => {
    const newP = {
      attachment: panel.querySelector('#att').value,
      style: panel.querySelector('#sty').value,
      behavior: panel.querySelector('#beh').value,
      trauma: panel.querySelector('#trauma').value.trim(),
      triggers: panel.querySelector('#trig').value.trim(),
      custom: panel.querySelector('#cust').value.trim()
    };
    saveProfile(char, newP);
    panel.remove();
  };
  panel.querySelector('#exportEC').onclick = () => {
    const dataStr = JSON.stringify(getProfile(char), null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = ${char}_emotions.json; a.click();
  };
  panel.querySelector('#importEC').onclick = () => panel.querySelector('#importFile').click();
  panel.querySelector('#importFile').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          saveProfile(char, imported);
          openPanel(); // Переоткрыть с обновлением
        } catch (err) { alert('Ошибка импорта: ' + err.message); }
      };
      reader.readAsText(file);
    }
  };
}

// Инициализация
eventSource.on(event_types.APP_READY, () => {
  setTimeout(addButton, 500);
});

console.log('Emotional Core v1.0.0 загружен');
