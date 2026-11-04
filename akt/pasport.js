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

function pasportOtvori(id, i) {
    pasId = id; pasI = +i || 0;
    const p = aktObekt(pasId);
    if (p) aktZapomniObekt(p, pasI);
    pasportRisuvai();
}

function pasportRisuvai() {
    const p = aktObekt(pasId);
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
}

// Разрешението за строеж. Текстът на предупреждението е дословно от стария
// екран: номерът и датата се преписват на ръка, защото сбъркана цифра не личи
// никъде и излиза чак при приемателната комисия. (Операторът, 13.10.2026)
function pasportRazreshenieHtml(p) {
    const rs = (p && p.permit) || {};
    const pole = (id, etiket, stoynost, mysto) => `
        <label class="p2-pole"><span>${etiket}</span>
            <input type="text" id="${id}" value="${_e(stoynost || '')}" placeholder="${mysto || ''}"></label>`;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Разрешение за строеж</div>
        <p class="tiho"><strong>Номерът и датата се преписват на ръка от самото
            разрешение.</strong> Те влизат в акт 7, акт 14, акт 15 и окончателния
            доклад — сбъркана цифра не личи никъде и излиза чак при приемателната
            комисия.</p>
        <div class="p2-mrezha">
            ${pole('fp-permit-num', 'Номер', rs.number, '№ 123')}
            ${pole('fp-permit-date', 'Дата', rs.date, 'дд.мм.гггг')}
            ${pole('fp-permit-effective', 'Влязло в сила на', rs.effective, 'дд.мм.гггг')}
        </div>
        ${pole('fp-permit-issuer', 'Издадено от', rs.issuer, 'Главен архитект на Столична община')}
    </div>`;
}

function pasportZapazi() {
    const p = aktObekt(pasId);
    // Разрешението се записва ОТДЕЛНО, защото `savePassport` не го чете — в
    // старото то е на друга страница.
    if (p) {
        const v = id => ((document.getElementById(id) || {}).value || '').trim();
        p.permit = { ...(p.permit || {}), number: v('fp-permit-num'), date: v('fp-permit-date'),
                     effective: v('fp-permit-effective'), issuer: v('fp-permit-issuer') };
    }
    if (typeof savePassport === 'function') savePassport();
    aktZapishi();
    location.hash = `#/obekt/${encodeURIComponent(pasId)}/${pasI}`;
}
