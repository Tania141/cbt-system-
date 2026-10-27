// АКТ СИСТЕМ · 12c-naucheno.js
// „Не се отнася“ става урок, вместо да умира на обекта
//
// Операторът, 27.10.2026: „обектите могат да се групират, но на този етап няма
// жива сила, която да каже — ей такива са групите, защото има изключения.
// Идеята е операторът с времето да научи системата за различните типове обекти
// и тогава системата ще натрупа чеклиста и ще търси верни такива.“
//
// Дотук „не се отнася“ се пазеше в `st.neotnasya` и там свършваше. Кажеш го
// десет пъти при един и същи тип строеж — на единайсетия системата пак пита.
// А това е най-чистият урок, който операторът дава: не „липсва ми“, а „това не
// важи за такива“.
//
// КАК СЕ ПОЗНАВА „ТАКЪВ“. Не по вид — „линеен обект“ е твърде грубо. По
// СЪСТАВКИТЕ: кабел СрН · шахтов ТП · водопровод. Урокът важи само когато
// съставките са СЪЩИТЕ, не подмножество. Нарочно е тясно: обект с една
// съставка повече може да иска точно онова, което тук не се е отнасяло.
// Различен профил → питаме веднъж, и този отговор става свой урок.
//
// ТРИ ПРАВИЛА, за да не ни изяде:
//   · всеки урок казва КОЙ го е дал, КОГА и ПРИ КОИ обекти;
//   · всеки урок се маха с един жест;
//   · никой урок не се прилага мълчаливо — екранът го показва като научен.
// Бавното учене не е опасно. Невидимото е.

'use strict';

let _otkazi = null;          // [{dokument, vid, sastavki[], obekti[], broy, koy, koga}]

const _nauchKlyuch = ime => String(ime || '').trim().toLowerCase().replace(/\s+/g, ' ');

async function nauchZaredi() {
    if (_otkazi) return;
    _otkazi = (await _danniVzemi('otkazi')) || [];
    if (!Array.isArray(_otkazi)) _otkazi = [];
}

function nauchVsichki() {
    return _otkazi || [];
}

// Профилът на строежа: вид плюс съставките, подредени, за да се сравняват.
// Съставките се четат от кухнята — `_kesSastavkiNa` в старото ПВА,
// `aktSastavki` в новото. Тук не се разпознава нищо.
function nauchProfil(p, st) {
    const s = st || p || {};
    let sast = [];
    if (typeof _kesSastavkiNa === 'function') sast = _kesSastavkiNa(p).map(x => x.kod);
    else if (typeof aktSastavki === 'function') sast = aktSastavki(p, s).map(x => x.kod);
    return { vid: String(s.vid || '').trim(), sastavki: [...new Set(sast)].sort() };
}

function _nauchEdinProfil(a, b) {
    return String(a.vid || '') === String(b.vid || '')
        && a.sastavki.length === b.sastavki.length
        && a.sastavki.every((x, i) => x === b.sastavki[i]);
}

// Уроците, които важат за ТОЗИ строеж.
function nauchZaProfil(p, st) {
    const profil = nauchProfil(p, st);
    return nauchVsichki().filter(o => _nauchEdinProfil(profil, {
        vid: o.vid, sastavki: [...(o.sastavki || [])].sort() }));
}

// Имената, които този строеж няма да пита, защото вече е научено.
function nauchNeotnasya(p, st) {
    return nauchZaProfil(p, st).map(o => o.dokument);
}

// Урокът за точно този ред — за екрана: „научено от 3 обекта“.
function nauchZaRed(p, st, dokument) {
    const k = _nauchKlyuch(dokument);
    return nauchZaProfil(p, st).find(o => _nauchKlyuch(o.dokument) === k) || null;
}

// ЗАПОМНЯНЕ. Казаното на обекта остава на обекта (то е факт за него); тук се
// пази и като урок за профила. Вторият път не добавя втори урок — брои се.
async function nauchZapomni(p, st, dokument) {
    if (!String(dokument || '').trim()) return null;
    await nauchZaredi();
    const profil = nauchProfil(p, st);
    const k = _nauchKlyuch(dokument);
    let urok = _otkazi.find(o => _nauchKlyuch(o.dokument) === k
        && _nauchEdinProfil(profil, { vid: o.vid, sastavki: [...(o.sastavki || [])].sort() }));
    if (!urok) {
        urok = { dokument: String(dokument).trim(), vid: profil.vid, sastavki: profil.sastavki,
                 obekti: [], broy: 0, koy: typeof _s2Koy === 'function' ? _s2Koy() : '',
                 koga: new Date().toISOString() };
        _otkazi.push(urok);
    }
    const pi = String(p && p.pi || '').trim();
    if (pi && !urok.obekti.includes(pi)) { urok.obekti.push(pi); urok.broy = urok.obekti.length; }
    if (!urok.broy) urok.broy = 1;
    urok.koga = new Date().toISOString();
    await _danniZapishi('otkazi', _otkazi);
    return urok;
}

// ЗАБРАВЯНЕ. Един жест, и урокът го няма — за този профил. Останалите профили
// не се пипат: грешката е била при този тип строеж, не навсякъде.
async function nauchZabravi(p, st, dokument) {
    await nauchZaredi();
    const profil = nauchProfil(p, st);
    const k = _nauchKlyuch(dokument);
    const predi = _otkazi.length;
    _otkazi = _otkazi.filter(o => !(_nauchKlyuch(o.dokument) === k
        && _nauchEdinProfil(profil, { vid: o.vid, sastavki: [...(o.sastavki || [])].sort() })));
    if (_otkazi.length === predi) return false;
    await _danniZapishi('otkazi', _otkazi);
    return true;
}

// С думи: защо този ред не се пита. Показва се до реда — урок, който не може
// да се прочете, е същото като скрит урок.
function nauchObyasnenie(urok) {
    if (!urok) return '';
    const kogo = (urok.obekti || []).length;
    const koga = urok.koga ? new Date(urok.koga) : null;
    const data = koga && !isNaN(koga)
        ? `${String(koga.getDate()).padStart(2, '0')}.${String(koga.getMonth() + 1).padStart(2, '0')}.${koga.getFullYear()}`
        : '';
    return 'научено' + (urok.koy ? ' от ' + urok.koy : '') + (data ? ' на ' + data : '')
        + (kogo ? ` · при ${kogo} ${kogo === 1 ? 'обект' : 'обекта'} със същите съставки` : '')
        + ((urok.sastavki || []).length ? ' · ' + urok.sastavki.join(' · ') : ' · без съставки');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { nauchProfil, _nauchEdinProfil, nauchObyasnenie, _nauchKlyuch };
}
