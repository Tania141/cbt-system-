// ГЕНЕРИРАНЕТО БЕЗ ЕКРАН.
//
// Решено на 03.11.2026: двете ПВА са недовършено преместване, и първото, което
// се мести, е генерирането — докато то е само в старото, старото е
// задължително и всичко друго е театър.
//
// Дотук генерирането живееше вътре в екрана (`js/11-dokumenti.js`): четеше
// отметки по `doc-<id>`, пишеше в `status-<id>`, въртеше бутона. Повърхност и
// кухня в едно, затова не можеше да се повика отдругаде.
//
// Тук е само кухнята: какво се праща, какво се връща, какво се запомня.
// Екранът — кой да е екран — само вика.

// Какво ражда един момент. Моментът е папката по Наредба № 3; документите са
// това, което се съставя в него. Взима се от `DOC_CONFIG`, за да няма втори
// списък, който да се разминава.
function genVidoveZaMoment(moment) {
    const vsichki = typeof DOC_CONFIG !== 'undefined' ? DOC_CONFIG : [];
    const m = String(moment || '').toLowerCase().trim();
    if (!m) return vsichki.filter(d => !d.drugade);
    // Моментът носи името на документа си („Акт 15“, „Протокол 2“) — търси се
    // по него, а не по код, защото кодовете на моментите и на документите са
    // два различни речника.
    const kak = m.replace(/[^0-9а-я]+/g, ' ').trim();
    const namereni = vsichki.filter(d => {
        const e = String(d.label || '').toLowerCase().replace(/[^0-9а-я]+/g, ' ').trim();
        return e === kak || e.startsWith(kak + ' ') || kak.startsWith(e + ' ') || kak === e;
    });
    return namereni.length ? namereni : vsichki.filter(d => !d.drugade);
}

// ЕДИН документ. Връща името на файла и съдържанието; не пипа екрана и не
// записва нищо — записването е отделно, за да може екранът да покаже грешка,
// без да е останала половин следа.
async function genDokument(project, consultant, apiType, extra) {
    const dop = extra || {};
    if (typeof buildPassportRows !== 'function')
        throw new Error('липсва сглобяването на паспорта');
    const redove = buildPassportRows(project, consultant, dop.passportExtra || {});
    const telo = { passport: redove, pi: project.pi };
    if (dop.chast) { telo.chast = dop.chast; telo.akt12_number = dop.akt12_number; }

    const adres = String((typeof appData !== 'undefined' && appData.apiUrl) || '').replace(/\/$/, '');
    if (!adres) throw new Error('няма адрес на сървъра');
    const token = typeof getToken === 'function' ? getToken() : '';
    const r = await fetch(`${adres}/api/generate/${apiType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(telo),
    });
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        // Изтеклият достъп си има свое име — той не е грешка на документа.
        if (r.status === 401) throw new Error('изтече ти достъпът — влез пак');
        throw new Error(e.error || `сървърът отказа: ${r.status}`);
    }
    return {
        ime: dop.chast ? `akt12_${dop.akt12_number}_${project.pi}.docx`
                       : `${apiType}_${project.pi}.docx`,
        sadarzhanie: await r.blob(),
    };
}

// Сваляне — отделно от генерирането, за да може пробата да мине без браузър.
function genSvali(ime, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = ime; a.click();
    URL.revokeObjectURL(url);
}

// Какво се запомня след генериране.
//
// ВНИМАНИЕ (известно, непоправено): `generatedDocs` пази ПО ЕДИН запис на вид.
// Пренапишеш ли Акт 15, когато пишеш окончателния доклад — а операторът каза
// на 29.10, че така прави — следата от подписания се губи. Тук се пази
// поведението на стария екран, за да не се сменят две неща наведнъж.
function genZapishi(project, rezultati) {
    if (!rezultati || !rezultati.length) return;
    const spisak = (project.generatedDocs = project.generatedDocs || []);
    for (const r of rezultati) {
        const i = spisak.findIndex(d => d.type === r.type);
        if (i >= 0) spisak[i] = r; else spisak.push(r);
    }
    if (typeof addHistory === 'function')
        addHistory('generate', project.pi, `Генерирани .docx: ${rezultati.map(r => r.type).join(', ')}`);
}

// Акт 12 се съставя ПО ЧАСТИ — една задача за всяка част.
function genZadachi(vidove, chasti) {
    const zadachi = [];
    for (const v of vidove) {
        if (v.apiType !== 'akt12') { zadachi.push({ vid: v }); continue; }
        for (const ch of chasti || []) zadachi.push({ vid: v, chast: ch.chast, akt12_number: ch.number });
    }
    return zadachi;
}
