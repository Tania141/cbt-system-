// АКТ СИСТЕМ · новото ПВА · stai.js
// Стаите, преместени от старото ПВА на 17.11.2026 — цели, без преправяне.
//
// Консултанти · Регистър на заповедните книги · ОСИП · Проверки · Нормативна
// уредба · История · Данните (резервното копие от старите „Настройки“).
//
// HTML-ът им е старият (в index.html), рисува го старата кухня — `renderZK`,
// `renderConsultants`, `renderOsipPage`, `renderKakavPage`, `renderHistory`.
// Тук са само: кой екран кога се отваря, и мостът за няколкото имена, които
// старите стаи викат от стария екран (`smeniObekt`, `navigateTo`).
//
// Правилото на моста важи и тук: НИЩО не се смята. Само се посочва.

'use strict';

// Стаите без обект (на фирмата) и стаите на обекта. Регистърът на ЗК е и
// двете: списъкът е на фирмата, генерирането — на обекта.
const STAI_OBSHTI = ['konsultanti', 'zk', 'istoria', 'normativna', 'danni'];
const STAI_NA_OBEKTA = ['osip', 'proverki', 'zk'];

// Старите имена на страниците → новите екрани. Старите стаи викат
// `navigateTo('zk')`, `navigateTo('consultants')` — мостът ги превежда.
Object.assign(_MOST_STRANICI, {
    zk: (id, i) => id ? `#/zk/${encodeURIComponent(id)}/${i}` : '#/zk',
    consultants: () => '#/konsultanti',
    osip: (id, i) => `#/osip/${encodeURIComponent(id)}/${i}`,
    kakav: (id, i) => `#/proverki/${encodeURIComponent(id)}/${i}`,
    history: () => '#/istoria',
    normativna: () => '#/normativna',
    settings: () => '#/danni',
    imot: (id, i) => id ? `#/obekt/${encodeURIComponent(id)}/${i}` : '#/plot',
    nadzor: (id, i) => id ? `#/obekt/${encodeURIComponent(id)}/${i}` : '#/plot',
});

// Изборът на обект в старите стаи вика `smeniObekt(id, 'osip')`, а онзи рисува
// стария екран по име — и гърми на `renderImotPage`, който тук не се зарежда.
// Тук изборът е адрес: новият обект се отваря в същата стая.
function smeniObekt(id, stranica) {
    const p = (aktDanni.projects || []).find(x => String(x.id) === String(id));
    if (!p) return;
    aktZapomniObekt(p, 0);
    const kade = _MOST_STRANICI[stranica];
    location.hash = kade ? kade(p.id, 0) : `#/obekt/${encodeURIComponent(p.id)}/0`;
}

// Съобщенията. Мостът ги пращаше в конзолата — а старите стаи казват през тях
// „Въведете фирма!“, „вписана“, „анулирана“. Мълчаливо съобщение е по-лошо от
// никакво, затова тук излизат на екрана.
function showAlert(vid, tekst, trae) {
    let kutiya = document.getElementById('alerts-container');
    if (!kutiya) {
        kutiya = document.createElement('div');
        kutiya.id = 'alerts-container';
        kutiya.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:1100;display:flex;'
            + 'flex-direction:column;gap:6px;max-width:420px';
        document.body.append(kutiya);
    }
    const cvyat = { success: ['#e6f4ec', '#2d7d52'], error: ['#fbe9e9', '#b33030'],
                    warning: ['#fbf3e2', '#8a6522'] }[vid] || ['#e5f0fa', '#1f6bb5'];
    const d = document.createElement('div');
    d.style.cssText = `background:${cvyat[0]};color:${cvyat[1]};border-radius:8px;padding:10px 14px;`
        + 'font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.12)';
    d.textContent = String(tekst).replace(/<[^>]*>/g, '');
    kutiya.prepend(d);
    setTimeout(() => d.remove(), trae || 6000);
    console.info('[' + vid + '] ' + d.textContent);
}

// `formatDateTime` живее в `js/14-kraj.js`, а той пуска старото приложение при
// зареждане — затова не се зарежда. Историята го иска за датите.
if (typeof formatDateTime !== 'function') {
    // eslint-disable-next-line no-var
    var formatDateTime = iso => {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return String(iso);
        const dv = n => String(n).padStart(2, '0');
        return `${dv(d.getDate())}.${dv(d.getMonth() + 1)}.${d.getFullYear()} ${dv(d.getHours())}:${dv(d.getMinutes())}`;
    };
}

function staiEStaya(ekran, id) {
    return STAI_OBSHTI.includes(ekran) || (!!id && STAI_NA_OBEKTA.includes(ekran));
}

// Отваря стаята. При стая на обекта първо се запомня обектът — старата кухня
// пита `_zhivObekt()`, а той чете `currentProject`.
function staiOtvori(ekran, id, i) {
    if (id) {
        const p = aktObekt(id);
        if (p) aktZapomniObekt(p, i);
    }
    try {
        if (ekran === 'konsultanti') { renderConsultants(); resetConsultantForm(); }
        else if (ekran === 'zk') renderZK();
        else if (ekran === 'osip') renderOsipPage();
        else if (ekran === 'proverki') renderKakavPage();
        else if (ekran === 'istoria') renderHistory();
        else if (ekran === 'normativna') proveriIzvori();
    } catch (e) {
        // Стая, която гърми, казва защо — не стои празна.
        const sek = document.getElementById('ekran-' + ekran);
        if (sek) sek.querySelector('.stara-staya').insertAdjacentHTML('afterbegin',
            `<p class="greshka">Стаята не се отвори: ${_e(e.message)}</p>`);
        console.error('staiOtvori', ekran, e);
    }
}

// Връщане от копие. Старото `doImport` подменя `appData` с нов обект — тук това
// би откъснало кухнята от данните на новото ПВА. Затова се пълни същият обект.
function staiVnos(ev) {
    const fajl = ev.target.files && ev.target.files[0];
    const hod = document.getElementById('stai-vnos-hod');
    if (!fajl) return;
    const r = new FileReader();
    r.onload = () => {
        let d;
        try { d = JSON.parse(r.result); } catch (e) { if (hod) hod.textContent = 'Файлът не е копие (.json).'; return; }
        if (!d || !Array.isArray(d.projects)) { if (hod) hod.textContent = 'В файла няма обекти — не е копие на АКТ СИСТЕМ.'; return; }
        const sega = (aktDanni.projects || []).length;
        if (!confirm(`Копието носи ${d.projects.length} обекта; сега в браузъра са ${sega}.\n\n`
                     + 'Всичко в браузъра се заменя с копието. Продължи?')) return;
        for (const k of Object.keys(aktDanni)) delete aktDanni[k];
        Object.assign(aktDanni, d);
        if (!aktZapishi()) { if (hod) hod.textContent = 'Не се записа — виж съобщението горе.'; return; }
        location.hash = '#/plot';
        location.reload();
    };
    r.readAsText(fajl);
}
