// Кодът на приложението, събран от модулите — за пробите.
//
// Модулите в js/ се включват по ред и споделят едно глобално пространство,
// точно както беше единият скрипт. Пробите четат тук, за да не знаят кой файл
// какво съдържа: преместиш ли функция от един модул в друг, пробите не се
// пипат. (Стъпка 2 от ПОДРЕЖДАНЕ.md, 13.10.2026)
const fs = require('fs');
const path = require('path');

const JS = path.join(__dirname, '..', 'js');
const HTML = path.join(__dirname, '..', 'index.html');

// Редът е този, по който index.html ги включва — не азбучният.
function redNaModulite(html = fs.readFileSync(HTML, 'utf8')) {
    const r = [...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m => m[1]);
    if (!r.length) throw new Error('index.html не включва нито един модул от js/');
    return r;
}

// Целият код, слепен по реда на включване.
function kod(html) {
    return redNaModulite(html).map(f => fs.readFileSync(path.join(JS, f), 'utf8')).join('\n');
}

// Страницата с вградени модули — jsdom не сваля външни скриптове и не бива
// (пробата да не ходи в мрежата).
function stranicaSVgradenKod(htmlPat = HTML) {
    const html = fs.readFileSync(htmlPat, 'utf8');
    const faylove = redNaModulite(html);
    let out = html;
    for (const f of faylove) {
        const telo = fs.readFileSync(path.join(JS, f), 'utf8');
        out = out.replace(`<script src="js/${f}"></script>`, () => '<script>' + telo + '</script>');
    }
    if (/<script src="js\//.test(out)) throw new Error('не всички модули бяха вкарани');
    return out;
}

// Вади една функция от кода — както е написана, с тялото ѝ.
function grab(izvor, ime) {
    const i = izvor.indexOf('function ' + ime + '(');
    if (i < 0) throw new Error('няма функция ' + ime);
    let k = izvor.indexOf('{', i), b = 0;
    for (; k < izvor.length; k++) {
        if (izvor[k] === '{') b++;
        else if (izvor[k] === '}') { b--; if (!b) return izvor.slice(i, k + 1); }
    }
    throw new Error('не намирам края на ' + ime);
}

const parche = (izvor, ot, do_) => izvor.slice(izvor.indexOf(ot), izvor.indexOf(do_));

module.exports = { JS, HTML, redNaModulite, kod, stranicaSVgradenKod, grab, parche };
