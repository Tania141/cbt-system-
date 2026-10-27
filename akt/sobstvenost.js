// АКТ СИСТЕМ · новото ПВА · sobstvenost.js
// ЕКРАН 5. СОБСТВЕНОСТТА
//
// Заданието е кратко и ясно: „Както е сега — лица, обекти, актове — защото
// работи и защото е единственото място, където се доказва кой е възложител.
// Едно допълнение: горе да казва с едно изречение какво липсва.“
//
// Затова тук НЕ се смята нищо. Сметките с идеалните части идват от
// `js/07-sobstvenost.js` през `most.js`; този файл само ги показва.
//
// Собствеността виси на ИМОТА, не на строежа — при три разрешения за строеж
// в един имот тя е една. Затова екранът не носи номер на строеж в заглавието
// си и не се мени при превключване между строежите.

'use strict';

let sobstvenostId = null;

function sobstvenostOtvori(id, i) {
    sobstvenostId = id;
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('sobstvenost-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, i);
    sobstvenostRisuvai();
}

function sobstvenostRisuvai() {
    const p = aktObekt(sobstvenostId);
    if (!p) return;
    document.getElementById('sobstvenost-telo').innerHTML =
        sobstvenostIzrechenieHtml(p)
        + sobstvenostVazlozhiteliHtml(p)
        + sobstvenostNahodkiHtml(p)
        + sobstvenostVerigaHtml(p)
        + sobstvenostVrazkaHtml();
}

// ── Едно изречение: какво липсва ─────────────────────────────────────────────
// Допълнението, което заданието иска. Кухнята вече го смята — `_sbSastoyanie`
// връща или „веригата връзва“, или първата находка, която я къса.

function sobstvenostIzrechenieHtml(p) {
    const s = _sbSastoyanie(p);
    return `
    <div class="izrechenie izrechenie-${s.gotovo ? 'dobre' : 'lipsva'}">
        <span class="izrechenie-znak">${s.gotovo ? '✓' : '⚠'}</span>
        <span>${_e(s.tekst)}</span>
    </div>`;
}

// ── Възложителите: кой какво държи днес ──────────────────────────────────────
// „Възложител“ не се въвежда — извежда се. Възложител е онзи, който ДНЕС
// държи дял от обекта, в който се строи.

function sobstvenostVazlozhiteliHtml(p) {
    const s = _sbDanni(p);
    const vaz = _sbVazlozhiteli(p);
    if (!vaz.length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Възложители</div>
            <p>Още никой — регистърът е празен. Качи акта, с който е придобит имотът.</p></div>`;
    }
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Възложители · ${vaz.length}</div>
        <p class="poyasnenie">Не се въвеждат — извеждат се. Възложител е онзи, който днес
           държи дял от обекта, в който се строи.</p>
        ${vaz.map(v => {
            const l = _sbLice(s, v.lice) || {};
            const pr = l.predstavitel;
            return `
            <div class="vaz-red">
                <div class="vaz-ime">${_e(v.ime)}${l.vid === 'юридическо'
                    ? '<span class="otkade">юридическо лице</span>' : ''}</div>
                <div class="vaz-prava">
                    ${v.prava.map(x => `${_e(_sbImeObekt(s, x.obekt))} — <strong>${
                        _e(_drTekst(x.dyal))}</strong>`).join(' · ')}
                </div>
                ${pr ? `<div class="otkade">подписва ${_e(pr.ime)}${
                    pr.nomer ? ', пълномощно рег. № ' + _e(pr.nomer) : ''}${
                    pr.data ? ' от ' + _e(pr.data) + ' г.' : ''}</div>` : ''}
            </div>`;
        }).join('')}
    </div>`;
}

// ── Находките: само каквото не връзва ────────────────────────────────────────
// Кодът съди, но само за това, което има значение. От сто акта обикновено три.

const SOBSTVENOST_VID = {
    prazno: 'няма събитие', nepalno: 'непълна верига', minus: 'прехвърлено повече',
    pochinal: 'починал собственик', prazen_akt: 'акт без номер',
};

function sobstvenostNahodkiHtml(p) {
    const nah = _sbNahodki(p);
    if (!nah.length) return '';
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Какво не връзва · ${nah.length}</div>
        ${nah.map(n => `
            <div class="nahodka">
                <span class="nahodka-vid">${_e(SOBSTVENOST_VID[n.vid] || n.vid)}</span>
                <span>${_e(n.tekst)}</span>
            </div>`).join('')}
    </div>`;
}

// ── Веригата: събитията, най-новото най-отгоре ───────────────────────────────

function sobstvenostVerigaHtml(p) {
    const s = _sbDanni(p);
    const sabitia = [...(s.sabitia || [])]
        .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
    if (!sabitia.length) return '';
    return `
    <details class="kutiya-razdel minali" open>
        <summary>Веригата · ${sabitia.length} ${sabitia.length === 1 ? 'събитие' : 'събития'}</summary>
        ${sabitia.map(e => `
            <div class="sabitie">
                <div class="sabitie-glava">
                    <span class="sabitie-vid">${_e(e.vid || 'придобиване')}</span>
                    ${e.data ? `<span class="otkade">${_e(e.data)}</span>` : ''}
                    <span class="otkade">${_e(_sbImeObekt(s, e.obekt))}</span>
                </div>
                <div class="sabitie-koj">
                    ${e.ot_opisanie ? _e(e.ot_opisanie) + ' → ' : ''}${
                    (e.pridobivashti || []).map(x => {
                        // В СЪБИТИЕТО дялът се пази като ТЕКСТ („1/2“, „8,38 %“)
                        // и се чете с `_dr`. В сметката на възложителите той вече
                        // е дроб и не се чете пак. Двете се смесват лесно.
                        const f = _dr(x.dyal);
                        return `${_e(_sbImeLice(s, x.lice))} <strong>${
                            f ? _e(_drTekst(f)) : _e(String(x.dyal || '?'))}</strong>`;
                    }).join(', ')}
                </div>
                ${e.dokument ? `<div class="otkade">${_e(e.dokument)}</div>` : ''}
                ${e.ot_chetene ? `<div class="otkade">прочетено от ${_e(e.ot_chetene)}</div>` : ''}
            </div>`).join('')}
    </details>`;
}

// ── Редакцията ───────────────────────────────────────────────────────────────
// Въвеждането на лица, обекти и събития си остава в старото ПВА: то работи и
// заданието казва да не се пипа. Тук се ГЛЕДА; поправя се там.

function sobstvenostVrazkaHtml() {
    return `
    <div class="vrazki">
        <a class="vrazka" href="../index.html" target="_blank" rel="noopener">
            Поправи регистъра<span>лица, обекти, актове · в старото ПВА ↗</span></a>
    </div>`;
}
