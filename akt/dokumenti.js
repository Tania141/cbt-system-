// ЕКРАН: ДОКУМЕНТИТЕ НА МОМЕНТА.
//
// Първата стая, която се мести от старото ПВА (решено 03.11.2026). Докато
// генерирането беше само там, старото оставаше задължително.
//
// Екранът не знае как се прави документ — това е в кухнята
// (`js/11b-generirane.js`). Тук е само: какво се предлага, какво е избрано,
// какво се случи.

let dokId = null, dokI = 0, dokMoment = '';
let dokIzbrani = new Set();
let dokSastoyanie = {};     // apiType → 'chaka' | 'gotov' | текст на грешката
let dokRaboti = false;

function dokumentiOtvori(id, i, moment) {
    dokId = id; dokI = +i || 0; dokMoment = moment || '';
    dokIzbrani = new Set();
    dokSastoyanie = {};
    const p = aktObekt(dokId);
    if (!p) { document.getElementById('dokumenti-telo').innerHTML = '<p>Няма такъв обект.</p>'; return; }
    aktZapomniObekt(p, dokI);
    // Документът на момента е избран предварително — най-честото е едно.
    const vidove = dokumentiVidove();
    if (vidove.length === 1) dokIzbrani.add(vidove[0].apiType);
    dokumentiRisuvai();
}

function dokumentiVidove() {
    return typeof genVidoveZaMoment === 'function' ? genVidoveZaMoment(dokMoment) : [];
}

function dokumentiZhiv() {
    const p = aktObekt(dokId);
    if (!p) return null;
    return { p, st: aktStroezh(p, dokI) };
}

function dokumentiRisuvai() {
    const z = dokumentiZhiv();
    if (!z) return;
    const vidove = dokumentiVidove();
    const konsultant = (aktDanni.consultants || []).find(c => c.id == (z.p.consultant || {}).id);

    const red = v => {
        const s = dokSastoyanie[v.apiType];
        const znak = s === 'gotov' ? '<span class="gotov">✔ изтеглен</span>'
                   : s === 'chaka' ? '<span class="tiho">⏳ изпраща се…</span>'
                   : s ? `<span class="greshka">✗ ${_e(s)}</span>` : '';
        return `<label class="dok-red">
            <input type="checkbox" ${dokIzbrani.has(v.apiType) ? 'checked' : ''}
                   onchange="dokumentiMarkirai('${_e(v.apiType)}', this.checked)">
            <span class="dok-ime">${_e(v.label)}</span>
            ${znak}</label>`;
    };

    document.getElementById('dokumenti-telo').innerHTML = `
    <div class="kutiya-razdel">
        <div class="nadpis">${_e(dokMoment || 'Документите')}</div>
        ${!konsultant ? `<p class="greshka">Обектът няма избран консултант —
            документът не може да се състави.</p>` : ''}
        ${vidove.length ? vidove.map(red).join('') :
            '<p class="tiho">За този момент няма описан документ.</p>'}
        <div class="redica" style="margin-top:12px">
            <button class="bt bt-glaven" onclick="dokumentiSastavi()"
                    ${dokRaboti || !konsultant ? 'disabled' : ''}>
                ${dokRaboti ? 'Съставя се…' : 'Съставѝ'}</button>
            <span class="tiho">Файлът се сваля веднага; следата остава в обекта.</span>
        </div>
    </div>
    ${dokumentiKakvoVlizaHtml(z)}`;
}

// КАКВО ЩЕ ВЛЕЗЕ — преди да се натисне, не след като се разпечата.
//
// Операторът, 29.10.2026, научи какво е влязло чак от свалените .docx. Затова
// тук стои кратко: колко документа влизат в акта и кое още чака сверяване.
function dokumentiKakvoVlizaHtml(z) {
    if (typeof dokTetradka !== 'function') return '';
    const redove = dokTetradka(z.p, z.st);
    if (!redove.length) return '';
    const vlizat = redove.filter(r => r.sveren);
    const chakat = redove.length - vlizat.length;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Какво ще влезе</div>
        <p class="tiho"><strong>${vlizat.length}</strong> сверени документа влизат в текста${
            chakat ? `; <strong>${chakat}</strong> още чакат сверяване и НЕ влизат` : ''}.</p>
        ${chakat ? `<p class="tiho">Нечекнатото не е недовършено — то е оставено отвън нарочно.
            Досието е мястото, където се чекне.</p>` : ''}
    </div>`;
}

function dokumentiMarkirai(apiType, da) {
    if (da) dokIzbrani.add(apiType); else dokIzbrani.delete(apiType);
}

async function dokumentiSastavi() {
    const z = dokumentiZhiv();
    if (!z || dokRaboti) return;
    const konsultant = (aktDanni.consultants || []).find(c => c.id == (z.p.consultant || {}).id);
    if (!konsultant) return;
    const vidove = dokumentiVidove().filter(v => dokIzbrani.has(v.apiType));
    if (!vidove.length) { alert('Избери поне един документ.'); return; }

    dokRaboti = true;
    dokumentiRisuvai();
    const rezultati = [];
    for (const zadacha of genZadachi(vidove, z.p.akt12_chasti || [])) {
        const v = zadacha.vid;
        dokSastoyanie[v.apiType] = 'chaka';
        dokumentiRisuvai();
        try {
            const { ime, sadarzhanie } = await genDokument(z.p, konsultant, v.apiType, zadacha);
            genSvali(ime, sadarzhanie);
            dokSastoyanie[v.apiType] = 'gotov';
            rezultati.push({ type: zadacha.chast ? `${v.label} (${zadacha.akt12_number})` : v.label,
                             date: new Date().toISOString(), url: '', path: '' });
        } catch (e) {
            dokSastoyanie[v.apiType] = e.message;
        }
        dokumentiRisuvai();
    }
    if (rezultati.length) { genZapishi(z.p, rezultati); aktZapishi(); }
    dokRaboti = false;
    dokumentiRisuvai();
}
