// Описът на Акт 15 (ПРИЛОЖЕНИЕ 1) — един документ, един ред, без повторения.
//
// Операторът, 06.11.2026, по генериран Акт 15: Акт обр. 14 стоеше три пъти,
// РС и Протокол 2 — по два; „№ 277/02.11.2023г., № 277/02.11.2023г., от
// 02.11.2023 г.“; „дело №76 от 2026г. от 2026 г.“.
const fs = require('fs');
const path = require('path');

const KOREN = path.join(__dirname, '..');
const chete = f => fs.readFileSync(path.join(KOREN, 'js', f), 'utf8');
const grab = (s, ime) => {
    const i = s.indexOf('function ' + ime + '(');
    if (i < 0) throw new Error('няма ' + ime);
    let k = s.indexOf('{', i), b = 0;
    for (; k < s.length; k++) { if (s[k] === '{') b++; if (s[k] === '}' && --b === 0) break; }
    return s.slice(i, k + 1);
};
const F = new Function(grab(chete('04b-spisak.js'), 'dokIzrechenie') + '\n'
    + grab(chete('08-momenti.js'), '_a15VidoveNaRed') + '\n'
    + 'return { dokIzrechenie, _a15VidoveNaRed };')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const rs = F.dokIzrechenie({ ime: 'Разрешение за строеж № 277/02.11.2023г.', nomer: '277/02.11.2023г.', data: '02.11.2023' });
t('номерът и датата не се повтарят, щом са в името', rs === 'Разрешение за строеж № 277/02.11.2023г.', rs);
const dog = F.dokIzrechenie({ ime: 'Договор за присъединяване', nomer: '967', data: '19.12.2023' });
t('иначе номерът и датата се добавят', dog === 'Договор за присъединяване, № 967, от 19.12.2023 г.', dog);

const v = F._a15VidoveNaRed;
t('трите изписвания на Акт 14 са един вид',
  ['Акт Образец 14 от 13.05.2025 г.', 'Приложение № 14 към чл. 7, ал. 3, т. 14 (Образец 14)', 'Акт обр. 14']
      .every(r => v(r).join() === 'a14'));
t('двете на Протокол 2 са един вид',
  v('Приложение № 2 към чл. 7, ал. 3, т. 2, (Образец 2), от 06.12.2023 г.').join() === 'p2'
  && v('Протокол за откриване на строителна линия и ниво на строежа').join() === 'p2');
t('нотариалният акт не е „акт 7“', v('Нотариален акт №72, том III').length === 0);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — описът е един`);
process.exit(loshi.length ? 1 : 0);
