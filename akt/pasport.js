// ЕКРАН: ПАСПОРТЪТ — ДАННИТЕ НА ОБЕКТА.
//
// Втората преместена стая (04.11.2026), и първата, която се мести по
// ЗАВИСИМОСТ: генерирането вече е тук, но Протокол 2 излизаше с празно
// разрешение за строеж, защото РС се въвежда в паспорта. Данните идват преди
// документа.
//
// „Не се преправя“ е взето буквално: формата е СЪЩАТА — вика се
// `renderPassportForm` от кухнята и се записва със `savePassport`. Тук има
// само трите кутии, които тя пълни, и обвивката наоколо.
//
// Разрешението за строеж е изключение и се казва защо: в старото то живее на
// друга страница („Документите“), заедно с четенето, което вече е в Досието.
// Затова неговата карта е пренесена тук — със същите полета и същите ключове.

let pasId = null, pasI = 0;

// `id === 'nov'` значи НОВ обект. Дотук новият обект се завеждаше само в
// старото ПВА — бутонът на плота просто те изпращаше там. (04.11.2026)
function pasportNov() { return pasId === 'nov'; }

function pasportOtvori(id, i) {
    pasId = id; pasI = +i || 0;
    const p = pasportNov() ? null : aktObekt(pasId);
    if (p) aktZapomniObekt(p, pasI);
    pasportRisuvai();
}

function pasportRisuvai() {
    const p = pasportNov() ? null : aktObekt(pasId);
    document.getElementById('pasport-telo').innerHTML = `
    <div class="kutiya-razdel">
        <div class="nadpis" id="form-page-title"></div>
        <p class="tiho" id="form-page-subtitle"></p>
        <div id="new-passport-content"></div>
    </div>
    ${pasportRazreshenieHtml(p)}
    <div class="redica" style="margin-top:12px">
        <button class="bt bt-glaven" onclick="pasportZapazi()">Запази</button>
        <span class="tiho">Записва се в обекта и се изпраща на сървъра.</span>
    </div>`;
    // СЪЩАТА форма, не нова. Ако някой ден се смени оттатък, се сменя и тук.
    if (typeof renderPassportForm === 'function') renderPassportForm(p ? p.id : null);
    // Фазата крие и показва — включително картата с разрешението за строеж.
    // Вика се СЛЕД формата, защото тя рисува бутоните на фазата.
    if (typeof setFaza === 'function') setFaza((p && p.faza) || 'osip');
    pasportVazlozhiteliBuuton(p);
}

// ВЪЗЛОЖИТЕЛИТЕ НЕ СЕ ПИШАТ В ПАСПОРТА. Операторът, 04.11.2026: полетата вън,
// остава само бутон, който води в Собствеността — там те се извеждат.
//
// Двете карти на формата се СКРИВАТ, не се махат: `savePassport` чете
// редовете и упълномощения от DOM-а. Махнати, записът би изтрил писаното на
// ръка в старите обекти — а то още влиза в документите, докато регистърът е
// празен. Скрити, то се пази непипнато.
function pasportVazlozhiteliBuuton(p) {
    const rachno = document.getElementById('karta-vazlozhiteli-rachno');
    if (!rachno) return;
    rachno.style.display = 'none';
    const otRegistara = rachno.parentNode.querySelector('[onclick*="\'sobstvenost\'"]');
    const kartaReg = otRegistara && otRegistara.closest('.card');
    if (kartaReg) kartaReg.style.display = 'none';
    const buton = document.createElement('div');
    buton.className = 'card';
    buton.id = 'pas-vazlozhiteli';
    buton.innerHTML = p
        ? `<div class="card-header"><div class="card-title" style="flex:1">Възложители</div>
            <a class="btn btn-secondary btn-sm" href="#/sobstvenost/${encodeURIComponent(p.id)}/${pasI}">
                Към Собствеността →</a></div>`
        : `<div class="card-title">Възложители</div>
           <p class="tiho">Водят се в Собствеността — първо запази паспорта.</p>`;
    rachno.parentNode.insertBefore(buton, rachno);
}

// Разрешението за строеж. Текстът на предупреждението е дословно от стария
// екран: номерът и датата се преписват на ръка, защото сбъркана цифра не личи
// никъде и излиза чак при приемателната комисия. (Операторът, 13.10.2026)
function pasportRazreshenieHtml(p) {
    // Разрешението е на СТРОЕЖА, не на имота (вж. `_STROEZH_POLETA`) — при
    // втори строеж се пишеше върху първия. (10.11.2026)
    const st = p ? aktStroezh(p, pasI) : null;
    const rs = (st && st.permit) || {};
    const pole = (id, etiket, stoynost, mysto) => `
        <label class="p2-pole"><span>${etiket}</span>
            <input type="text" id="${id}" value="${_e(stoynost || '')}" placeholder="${mysto || ''}"></label>`;
    // Показва се само във фаза „Строителство“. Преди разрешението да е
    // издадено, тези полета нямат какво да съдържат — а празно поле на екрана
    // изглежда като нещо, което си пропуснала. (Операторът, 04.11.2026)
    //
    // `data-faza` е механизмът на самата форма: `setFaza` крие и показва по
    // него. Затова картата се подчинява на бутоните „Проектна“ / „Строителство“
    // без нито ред нов код там.
    return `
    <div class="kutiya-razdel" data-faza="stroitelstvo">
        <div class="nadpis">Разрешение за строеж</div>
        <p class="tiho"><strong>Номерът и датата се преписват на ръка от самото
            разрешение.</strong> Те влизат в акт 7, акт 14, акт 15 и окончателния
            доклад — сбъркана цифра не личи никъде и излиза чак при приемателната
            комисия.</p>
        <div class="redica">
            <input type="file" id="pas-rs-fajl" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.docx"
                   onchange="pasportChetiRS()">
            <span class="tiho">качи разрешението — четецът ще предложи, ти потвърждаваш</span>
        </div>
        <div id="pas-rs-hod"></div>
        <div class="p2-mrezha">
            ${pole('fp-permit-num', 'Номер', rs.number, '№ 123')}
            ${pole('fp-permit-date', 'Дата', rs.date, 'дд.мм.гггг')}
            ${pole('fp-permit-effective', 'Влязло в сила на', rs.effective, 'дд.мм.гггг')}
        </div>
        ${pole('fp-permit-issuer', 'Издадено от', rs.issuer, 'Главен архитект на Столична община')}
    </div>`;
}

// ЧЕТЕНЕ НА РАЗРЕШЕНИЕТО.
//
// Операторът, 04.11.2026: „в секция РС да се чете РС?“. Същият жест като при
// договора за строителство — качваш документа, четецът предлага, ти
// потвърждаваш. Прочетеното НЕ презаписва вече написаното: ако се различава,
// се казва и остава твоето.
const _PAS_RS_POLETA = [
    ['fp-permit-num', 'nomer', 'номерът'],
    ['fp-permit-date', 'data', 'датата'],
    ['fp-permit-issuer', 'izdatel', 'издателят'],
];

async function pasportChetiRS() {
    const vhod = document.getElementById('pas-rs-fajl');
    const hod = document.getElementById('pas-rs-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!f) return;
    if (/\.doc$/i.test(f.name)) { hod.innerHTML = '<p class="tiho">Стар .doc — запиши го като .docx или PDF.</p>'; return; }
    hod.innerHTML = `<p class="tiho">Чета „${_e(f.name)}“…</p>`;
    try {
        const r = await aktApi('/api/sloy2/chete', 'POST', {
            agenda: 'od', edin: true,
            chetec: localStorage.getItem('s2_chetec') || 'auto',
            fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) },
        });
        if (r.greshka) { hod.innerHTML = `<p class="greshka">⚠️ ${_e(r.greshka)}</p>`; return; }
        const dok = r.dokument || {};
        hod.innerHTML = pasportRSNapalni(dok, f.name)
            + (pasportRazreshenieLi(dok) ? pasportVDosietoHtml([dok], f.name) : '');
    } catch (e) {
        hod.innerHTML = `<p class="greshka">✗ ${_e(e.message)}</p>`;
    }
}

function pasportRazreshenieLi(dok) {
    return String(dok.vid_kod || '') === 'RS' || /разрешение\s+за\s+строеж/i.test(String(dok.vid || ''));
}

// Прочетеното в паспорта влиза и в досието — вж. aktVDosieto. При нов обект
// още няма къде: досието е на строежа, а строежът се ражда при записа.
function pasportVDosieto(novi, imeFajl) {
    if (pasportNov()) return false;
    const p = aktObekt(pasId);
    return p ? aktVDosieto(aktStroezh(p, pasI), novi, imeFajl) : false;
}

function pasportVDosietoHtml(novi, imeFajl) {
    return pasportVDosieto(novi, imeFajl)
        ? '<p class="tiho">Прочетеното влезе и в <strong>Досието</strong> — там се сверява.</p>'
        : (pasportNov() ? '<p class="tiho">В Досието ще влезе, когато прочетеш документа след първия запис на паспорта.</p>' : '');
}

function pasportRSNapalni(dok, imeFajl) {
    // Чужд документ: ако четецът не го е познал за разрешение за строеж, не се
    // пълни нищо. Скица, качена по погрешка, не бива да става разрешение.
    const vid = String(dok.vid || '');
    if (!pasportRazreshenieLi(dok))
        return `<p class="tiho">„${_e(imeFajl)}“ не изглежда като разрешение за строеж
            ${vid ? `— четецът го чете като „${_e(vid)}“` : ''}.</p>`;

    const vzeti = [], razlichni = [], lipsvat = [];
    for (const [id, pole, kakvo] of _PAS_RS_POLETA) {
        const el = document.getElementById(id);
        if (!el) continue;
        const v = String(((dok[pole] || {}).stoynost) || '').trim();
        if (!v) { lipsvat.push(kakvo); continue; }
        if (el.value.trim()) {
            if (el.value.trim() !== v) razlichni.push(`${kakvo}: в документа пише „${v}“`);
            continue;
        }
        el.value = v;
        vzeti.push(kakvo);
    }
    return `
        ${vzeti.length ? `<p class="gotov">✔ От „${_e(imeFajl)}“ попълнени: ${_e(vzeti.join(', '))}.
            <strong>Провери ги</strong>, преди да запишеш.</p>` : ''}
        ${razlichni.length ? `<p class="tiho">⚠️ Различава се от написаното —
            ${_e(razlichni.join('; '))}. Поправи на ръка, ако документът е прав.</p>` : ''}
        ${lipsvat.length ? `<p class="tiho">Документът не казва: ${_e(lipsvat.join(', '))}
            — впиши ги на ръка.</p>` : ''}
        <p class="tiho">Датата на влизане в сила е заверка ВЪРХУ разрешението и
            се преписва на ръка.</p>`;
}

function pasportZapazi() {
    const p = aktObekt(pasId);
    // Разрешението се записва ОТДЕЛНО, защото `savePassport` не го чете — в
    // старото то е на друга страница.
    if (p) {
        const v = id => ((document.getElementById(id) || {}).value || '').trim();
        // На строежа, който е отворен — не на имота (10.11.2026).
        const st = aktStroezh(p, pasI);
        st.permit = { ...(st.permit || {}), number: v('fp-permit-num'), date: v('fp-permit-date'),
                      effective: v('fp-permit-effective'), issuer: v('fp-permit-issuer') };
    }
    if (typeof savePassport === 'function') savePassport();
    aktZapishi();
    // При нов обект още няма към кого да се върнем — взима се току-що
    // записаният. `savePassport` го оставя в `currentProject`.
    const kam = pasportNov() ? ((aktDanni.currentProject || {}).id || '') : pasId;
    if (kam) location.hash = `#/obekt/${encodeURIComponent(kam)}/${pasportNov() ? 0 : pasI}`;
    else location.hash = '#/plot';
}
