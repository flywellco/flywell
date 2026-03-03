// ─────────────────────────────────────────────────────────────────────────────
// MONTH PICKER
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let pickerYear = new Date().getFullYear();
let selectedMonth = null;
let pickerVisible = false;

const pickerEl = document.createElement('div');
pickerEl.id = 'month-picker';
pickerEl.style.cssText = `display:none;position:fixed;background:#fff;border:1px solid rgba(40,30,20,0.14);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.7);padding:1.2rem;z-index:9999;min-width:280px;`;
pickerEl.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <button onclick="changeYear(-1)" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:rgba(28,22,18,0.45);padding:0.2rem 0.6rem;border-radius:6px;">‹</button>
    <span id="picker-year" style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:0.9rem;color:#1c1612;letter-spacing:0.05em;"></span>
    <button onclick="changeYear(1)" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:rgba(28,22,18,0.45);padding:0.2rem 0.6rem;border-radius:6px;">›</button>
  </div>
  <div id="month-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.4rem;"></div>
  <div style="margin-top:0.9rem;text-align:center;">
    <button onclick="clearMonth()" style="background:none;border:none;cursor:pointer;font-size:0.72rem;color:rgba(28,22,18,0.45);text-decoration:underline;font-family:'DM Sans',sans-serif;">Clear</button>
  </div>
`;
document.body.appendChild(pickerEl);

function renderMonthGrid() {
  document.getElementById('picker-year').textContent = pickerYear;
  const grid = document.getElementById('month-grid');
  const now = new Date();
  grid.innerHTML = '';
  MONTHS.forEach((m, i) => {
    const isPast = pickerYear < now.getFullYear() || (pickerYear === now.getFullYear() && i < now.getMonth());
    const isSelected = selectedMonth && selectedMonth.year === pickerYear && selectedMonth.monthIdx === i;
    const btn = document.createElement('button');
    btn.textContent = m;
    btn.disabled = isPast;
    btn.style.cssText = `border:1px solid ${isSelected?'#c47f2a':'rgba(40,30,20,0.12)'};background:${isSelected?'#c47f2a':'#fff'};color:${isPast?'rgba(28,22,18,0.2)':isSelected?'#fff':'#1c1612'};border-radius:8px;padding:0.45rem 0;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;cursor:${isPast?'default':'pointer'};transition:all 0.15s;width:100%;`;
    if (!isPast) btn.onclick = () => selectMonth(i);
    grid.appendChild(btn);
  });
}

function selectMonth(monthIdx) {
  selectedMonth = { year: pickerYear, monthIdx };
  document.getElementById('search-when').value = MONTHS_FULL[monthIdx] + ' ' + pickerYear;
  pickerEl.style.display = 'none';
  pickerVisible = false;
  renderMonthGrid();
}

function changeYear(dir) {
  const now = new Date();
  if (dir === -1 && pickerYear - 1 < now.getFullYear()) return;
  pickerYear += dir;
  renderMonthGrid();
}

function clearMonth() {
  selectedMonth = null;
  document.getElementById('search-when').value = '';
  pickerEl.style.display = 'none';
  pickerVisible = false;
  renderMonthGrid();
}

function toggleMonthPicker(e) {
  if (e) e.stopPropagation();
  if (pickerVisible) { pickerEl.style.display = 'none'; pickerVisible = false; return; }
  const input = document.getElementById('search-when');
  const rect = input.getBoundingClientRect();
  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 8;
  pickerEl.style.display = 'block';
  renderMonthGrid();
  const pickerWidth = pickerEl.offsetWidth;
  if (left + pickerWidth > window.innerWidth - 16) left = window.innerWidth - pickerWidth - 16;
  pickerEl.style.left = left + 'px';
  pickerEl.style.top = top + 'px';
  pickerVisible = true;
}

document.addEventListener('click', (e) => {
  if (pickerVisible && !pickerEl.contains(e.target) && e.target !== document.getElementById('search-when')) {
    pickerEl.style.display = 'none';
    pickerVisible = false;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED FILTER STATE
// ─────────────────────────────────────────────────────────────────────────────
let dealsShown = 9;
let currentRegion = 'all';

function applyAllFilters() {
  const cards = document.querySelectorAll('#deals-grid .deal-card');
  const fromInput = (document.getElementById('search-from').value || '').toLowerCase().trim();
  const toInput   = (document.getElementById('search-to').value   || '').toLowerCase().trim();

  const filtered = [];
  cards.forEach(card => {
    const regions  = (card.dataset.region  || '').split(' ');
    const fromData = (card.dataset.from    || '');
    const toData   = (card.dataset.to      || '');
    const country  = (card.dataset.country || '');
    const cardText = (card.textContent || '').toLowerCase();

    const matchRegion = currentRegion === 'all' || regions.includes(currentRegion);
    const matchFrom = !fromInput || fromData.includes(fromInput) || cardText.includes(fromInput);
    const matchTo   = !toInput   || toData.includes(toInput) || country.includes(toInput) || cardText.includes(toInput);

    let matchWhen = true;
    if (selectedMonth) {
      const deal = (window.DEALS || []).find(d => String(d.id) === String(card.dataset.deal));
      const availability = deal ? (deal.availability || '').toLowerCase() : '';
      const monthName = MONTHS_FULL[selectedMonth.monthIdx].toLowerCase();
      const year = String(selectedMonth.year);
      matchWhen = availability.includes(monthName) || availability.includes(year);
    }

    if (matchRegion && matchFrom && matchTo && matchWhen) filtered.push(card);
  });

  cards.forEach(card => card.style.display = 'none');
  filtered.slice(0, dealsShown).forEach(card => card.style.display = 'block');

  const loadMoreWrap = document.querySelector('.load-more-wrap');
  if (loadMoreWrap) loadMoreWrap.style.display = filtered.length > dealsShown ? 'block' : 'none';

  let noMsg = document.getElementById('no-results');
  if (!noMsg) {
    noMsg = document.createElement('p');
    noMsg.id = 'no-results';
    noMsg.style.cssText = 'text-align:center;color:rgba(28,22,18,0.45);padding:2rem;font-size:0.88rem;width:100%;grid-column:1/-1;';
    document.getElementById('deals-grid').appendChild(noMsg);
  }
  noMsg.style.display = filtered.length === 0 ? 'block' : 'none';
  noMsg.textContent   = filtered.length === 0 ? 'No deals found. Try a country name or nearby city.' : '';
}

function filterByRegion(pill, region) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  currentRegion = region;
  dealsShown = 9;
  applyAllFilters();
}

function runSearch() {
  dealsShown = 9;
  applyAllFilters();
}

function loadMore() {
  dealsShown += 9;
  applyAllFilters();
}

['search-from','search-to'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
});

// ─────────────────────────────────────────────────────────────────────────────
// NAV SEARCH
// ─────────────────────────────────────────────────────────────────────────────
function navSearch(val) {
  const resultsEl = document.getElementById('nav-search-results');
  if (!val || val.length < 2) { if (resultsEl) resultsEl.style.display = 'none'; return; }
  const q = val.toLowerCase();
  const all = window.DEALS || [];
  const fromLabel = d => (Array.isArray(d.from) ? d.from[0] : d.from) || '';
  const toLabel   = d => (Array.isArray(d.to)   ? d.to[0]   : d.to)   || '';
  const matches = all.filter(d =>
    fromLabel(d).toLowerCase().includes(q) ||
    toLabel(d).toLowerCase().includes(q)   ||
    (d.title || '').toLowerCase().includes(q)
  ).slice(0, 8);

  const activeInput = document.activeElement;
  const refInput = (activeInput && (activeInput.id === 'nav-search-input' || activeInput.id === 'mobile-search-input'))
    ? activeInput
    : document.getElementById('nav-search-input');
  const wrap = refInput.closest('.nav-search-wrap') || refInput.closest('.mobile-search-bar') || refInput;
  const rect = wrap.getBoundingClientRect();

  if (resultsEl) {
    resultsEl.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
    resultsEl.style.left = Math.min(rect.left, window.innerWidth - 310) + 'px';

    if (matches.length === 0) {
      resultsEl.innerHTML = `<div class="nav-result-empty">No deals found for "<strong>${val}</strong>"</div>`;
    } else {
      resultsEl.innerHTML = matches.map(d => {
        const from    = fromLabel(d);
        const to      = toLabel(d);
        const airline = Array.isArray(d.airline) ? d.airline[0] : (d.airline || '');
        const img     = resolveImage(Array.isArray(d.to) ? d.to : [d.to]) || d.img || '';
        return `<div class="nav-result-item" onclick="openDeal(${d.id})">
          <img class="nav-result-thumb" src="${img}" alt="${to.replace(/"/g,'&quot;')}" onerror="this.style.display='none'">
          <div class="nav-result-info">
            <div class="nav-result-route">${from} &rarr; ${to}</div>
            <div class="nav-result-title">${airline}</div>
          </div>
          <div class="nav-result-price">${d.price || ''}</div>
        </div>`;
      }).join('');
    }
    resultsEl.style.display = 'block';
  }
}

function navSearchGo() {
  const val = document.getElementById('nav-search-input').value.trim();
  if (!val) return;
  _doNavSearchGo(val);
}

function navSearchGoMobile() {
  const val = document.getElementById('mobile-search-input').value.trim();
  if (!val) return;
  _doNavSearchGo(val);
}

function _doNavSearchGo(val) {
  showPage('main');
  document.getElementById('search-from').value = '';
  document.getElementById('search-to').value = val;
  document.getElementById('nav-search-input').value = '';
  document.getElementById('mobile-search-input').value = '';
  const resultsEl = document.getElementById('nav-search-results');
  if (resultsEl) resultsEl.style.display = 'none';
  setTimeout(() => {
    runSearch();
    document.getElementById('deals-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

document.addEventListener('click', (e) => {
  const resultsEl = document.getElementById('nav-search-results');
  const navInput    = document.getElementById('nav-search-input');
  const mobileInput = document.getElementById('mobile-search-input');
  if (resultsEl && !resultsEl.contains(e.target) && e.target !== navInput && e.target !== mobileInput) {
    resultsEl.style.display = 'none';
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION IMAGE MAP
// ─────────────────────────────────────────────────────────────────────────────
const DEST_IMAGE_MAP = {
  'kabul':'afghanistan.jpg','tirana':'albania.jpg','algiers':'algeria.jpg','luanda':'angola.jpg',
  'buenos aires':'argentina-buenos-aires.jpg','yerevan':'armenia.jpg','vienna':'austria.jpg',
  'baku':'azerbaijan.jpg','nassau':'bahamas.jpg','manama':'bahrain.jpg','dhaka':'bangladesh.jpg',
  'bridgetown':'barbados.jpg','minsk':'belarus.jpg','brussels':'belgium.jpg','belmopan':'belize.jpg',
  'porto-novo':'benin.jpg','thimphu':'bhutan.jpg','sucre':'bolivia.jpg','sarajevo':'bosnia.jpg',
  'gaborone':'botswana.jpg','brasilia':'brazil.jpg','brasília':'brazil.jpg',
  'sao paulo':'brazil.jpg','são paulo':'brazil.jpg','rio de janeiro':'brazil.jpg',
  'bandar seri begawan':'brunei.jpg','sofia':'bulgaria.jpg','ouagadougou':'burkina-faso.jpg',
  'gitega':'burundi.jpg',
  'sal':'cabo-verde.jpg','sal, cape verde':'cabo-verde.jpg','praia':'cabo-verde.jpg',
  'phnom penh':'cambodia.jpg','siem reap':'cambodia.jpg','yaounde':'cameroon.jpg',
  'yaoundé':'cameroon.jpg','ottawa':'canada.jpg','toronto':'canada-toronto.jpg',
  'calgary':'canada.jpg','montreal':'canada.jpg','vancouver':'canada.jpg',
  'bangui':'central-african-republic.jpg',"n'djamena":'chad.jpg','santiago':'chile.jpg',
  'beijing':'china-beijing.jpg','shanghai':'china.jpg','chongqing':'china.jpg',
  'guangzhou':'china.jpg','moroni':'comoros.jpg','brazzaville':'congo.jpg',
  'san jose':'costa-rica.jpg','san josé':'costa-rica.jpg','liberia':'costa-rica.jpg',
  'zagreb':'croatia.jpg','havana':'cuba.jpg','nicosia':'cyprus.jpg','prague':'czech-republic.jpg',
  'copenhagen':'denmark.jpg','djibouti city':'djibouti.jpg','roseau':'dominica.jpg',
  'santo domingo':'dominican-republic.jpg','quito':'ecuador.jpg','cairo':'egypt.jpg',
  'san salvador':'el-salvador.jpg','asmara':'eritrea.jpg','tallinn':'estonia.jpg',
  'addis ababa':'ethiopia.jpg','suva':'fiji.jpg','helsinki':'finland.jpg',
  'paris':'france-paris.jpg','libreville':'gabon.jpg','banjul':'gambia.jpg',
  'tbilisi':'georgia.jpg','berlin':'germany-berlin.jpg','frankfurt':'germany.jpg',
  'munich':'germany.jpg','hamburg':'germany.jpg','accra':'ghana.jpg','athens':'greece.jpg',
  'guatemala city':'guatemala.jpg','conakry':'guinea.jpg','georgetown':'guyana.jpg',
  'port-au-prince':'haiti.jpg','tegucigalpa':'honduras.jpg','budapest':'hungary-budapest.jpg',
  'reykjavik':'iceland.jpg','reykjavík':'iceland.jpg','new delhi':'india.jpg',
  'delhi':'india.jpg','mumbai':'india-mumbai.jpg','goa':'india.jpg',
  'jakarta':'indonesia.jpg','bali':'indonesia-bali.jpg','lombok':'indonesia.jpg',
  'tehran':'iran.jpg','baghdad':'iraq.jpg','dublin':'ireland.jpg',
  'jerusalem':'israel.jpg','tel aviv':'israel.jpg','rome':'italy-rome.jpg',
  'milan':'italy.jpg','florence':'italy.jpg','venice':'italy.jpg',
  'kingston':'jamaica.jpg','tokyo':'japan-tokyo.jpg','osaka':'japan.jpg',
  'kyoto':'japan.jpg','amman':'jordan.jpg','nairobi':'kenya-nairobi.jpg',
  'mombasa':'kenya.jpg','kuwait city':'kuwait.jpg','bishkek':'kyrgyzstan.jpg',
  'vientiane':'laos.jpg','luang prabang':'laos.jpg','riga':'latvia.jpg',
  'beirut':'lebanon.jpg','tripoli':'libya.jpg','vilnius':'lithuania.jpg',
  'luxembourg city':'luxembourg.jpg','antananarivo':'madagascar.jpg',
  'lilongwe':'malawi.jpg','kuala lumpur':'malaysia.jpg','penang':'malaysia.jpg',
  'langkawi':'malaysia.jpg','male':'maldives.jpg','malé':'maldives.jpg',
  'bamako':'mali.jpg','valletta':'malta.jpg','mexico city':'mexico.jpg',
  'cancun':'mexico-cancun.jpg','cancún':'mexico-cancun.jpg','chisinau':'moldova.jpg',
  'ulaanbaatar':'mongolia.jpg','podgorica':'montenegro.jpg','rabat':'morocco.jpg',
  'marrakech':'morocco-marrakech.jpg','casablanca':'morocco.jpg','maputo':'mozambique.jpg',
  'windhoek':'namibia.jpg','kathmandu':'nepal.jpg',
  'amsterdam':'netherlands-amsterdam.jpg','wellington':'new-zealand.jpg',
  'auckland':'new-zealand.jpg','managua':'nicaragua.jpg','abuja':'nigeria.jpg',
  'lagos':'nigeria.jpg','oslo':'norway.jpg','muscat':'oman.jpg',
  'islamabad':'pakistan.jpg','karachi':'pakistan.jpg','panama city':'panama.jpg',
  'asuncion':'paraguay.jpg','asunción':'paraguay.jpg','lima':'peru-lima.jpg',
  'machu picchu':'peru.jpg','manila':'philippines.jpg','cebu':'philippines.jpg',
  'boracay':'philippines.jpg','warsaw':'poland.jpg','lisbon':'portugal-lisbon.jpg',
  'porto':'portugal.jpg','doha':'qatar.jpg','bucharest':'romania.jpg',
  'moscow':'russia.jpg','kigali':'rwanda.jpg','riyadh':'saudi-arabia.jpg',
  'dakar':'senegal.jpg','belgrade':'serbia.jpg','freetown':'sierra-leone.jpg',
  'singapore':'singapore.jpg','bratislava':'slovakia.jpg','ljubljana':'slovenia.jpg',
  'mogadishu':'somalia.jpg','cape town':'south-africa-cape-town.jpg',
  'johannesburg':'south-africa.jpg','durban':'south-africa.jpg',
  'pretoria':'south-africa.jpg','seoul':'south-korea-seoul.jpg',
  'busan':'south-korea.jpg','madrid':'spain-madrid.jpg',
  'barcelona':'spain-barcelona.jpg','malaga':'spain.jpg','málaga':'spain.jpg',
  'ibiza':'spain.jpg','mallorca':'spain.jpg','colombo':'sri-lanka.jpg',
  'paramaribo':'suriname.jpg','stockholm':'sweden-stockholm.jpg',
  'bern':'switzerland.jpg','zurich':'switzerland.jpg','taipei':'taiwan.jpg',
  'dushanbe':'tajikistan.jpg','dar es salaam':'tanzania.jpg',
  'zanzibar':'tanzania.jpg','bangkok':'thailand-bangkok.jpg',
  'phuket':'thailand-phuket.jpg','chiang mai':'thailand.jpg',
  'pattaya':'thailand.jpg','port of spain':'trinidad-and-tobago.jpg',
  'tunis':'tunisia.jpg','istanbul':'turkey-istanbul.jpg','ankara':'turkey.jpg',
  'kampala':'uganda.jpg','kyiv':'ukraine.jpg','abu dhabi':'uae.jpg',
  'dubai':'uae-dubai.jpg','london':'uk-london.jpg','edinburgh':'uk.jpg',
  'manchester':'uk.jpg','new york':'usa-new-york.jpg',
  'new york city':'usa-new-york.jpg','new york jfk':'usa-new-york.jpg',
  'nyc':'usa-new-york.jpg','los angeles':'usa.jpg','chicago':'usa-chicago.jpg',
  'miami':'usa.jpg','las vegas':'usa.jpg','washington':'usa.jpg',
  'washington dc':'usa.jpg','seattle':'usa.jpg','boston':'usa.jpg',
  'denver':'usa.jpg','orlando':'usa.jpg','austin':'usa.jpg','dallas':'usa.jpg',
  'philadelphia':'usa.jpg','charlotte':'usa.jpg','houston':'usa.jpg',
  'atlanta':'usa.jpg',
  'melbourne, florida':'usa.jpg','melbourne, florida, usa':'usa.jpg','melbourne':'usa.jpg',
  'montevideo':'uruguay.jpg','tashkent':'uzbekistan.jpg','caracas':'venezuela.jpg',
  'hanoi':'vietnam.jpg','ho chi minh city':'vietnam.jpg','ho chi minh':'vietnam.jpg',
  'saigon':'vietnam.jpg','da nang':'vietnam.jpg','lusaka':'zambia.jpg',
  'harare':'zimbabwe.jpg','hong kong':'china-hong-kong.jpg','macau':'china.jpg',
  'brisbane':'australia-brisbane.jpg','sydney':'australia-sydney.jpg',
  'perth':'australia.jpg','bogota':'colombia-bogota.jpg',
  'bogotá':'colombia-bogota.jpg','medellin':'colombia.jpg',
  'medellín':'colombia.jpg','cartagena':'colombia-cartagena.jpg',
  'afghanistan':'afghanistan.jpg','albania':'albania.jpg','algeria':'algeria.jpg',
  'argentina':'argentina.jpg','armenia':'armenia.jpg','australia':'australia.jpg',
  'austria':'austria.jpg','azerbaijan':'azerbaijan.jpg','bahamas':'bahamas.jpg',
  'bahrain':'bahrain.jpg','bangladesh':'bangladesh.jpg','barbados':'barbados.jpg',
  'belarus':'belarus.jpg','belgium':'belgium.jpg','belize':'belize.jpg',
  'bolivia':'bolivia.jpg','brazil':'brazil.jpg','brunei':'brunei.jpg',
  'bulgaria':'bulgaria.jpg','cambodia':'cambodia.jpg','cameroon':'cameroon.jpg',
  'canada':'canada.jpg','cape verde':'cabo-verde.jpg','chile':'chile.jpg',
  'china':'china.jpg','colombia':'colombia.jpg','costa rica':'costa-rica.jpg',
  'croatia':'croatia.jpg','cuba':'cuba.jpg','cyprus':'cyprus.jpg',
  'denmark':'denmark.jpg','ecuador':'ecuador.jpg','egypt':'egypt.jpg',
  'ethiopia':'ethiopia.jpg','fiji':'fiji.jpg','finland':'finland.jpg',
  'france':'france.jpg','germany':'germany.jpg','ghana':'ghana.jpg',
  'greece':'greece.jpg','guatemala':'guatemala.jpg','guyana':'guyana.jpg',
  'honduras':'honduras.jpg','hungary':'hungary-budapest.jpg','iceland':'iceland.jpg',
  'india':'india.jpg','indonesia':'indonesia.jpg','iran':'iran.jpg',
  'iraq':'iraq.jpg','ireland':'ireland.jpg','israel':'israel.jpg',
  'italy':'italy.jpg','jamaica':'jamaica.jpg','japan':'japan.jpg',
  'jordan':'jordan.jpg','kenya':'kenya.jpg','kuwait':'kuwait.jpg',
  'laos':'laos.jpg','latvia':'latvia.jpg','lebanon':'lebanon.jpg',
  'lithuania':'lithuania.jpg','madagascar':'madagascar.jpg',
  'malaysia':'malaysia.jpg','maldives':'maldives.jpg','malta':'malta.jpg',
  'mexico':'mexico.jpg','mongolia':'mongolia.jpg','morocco':'morocco.jpg',
  'mozambique':'mozambique.jpg','myanmar':'myanmar.jpg','namibia':'namibia.jpg',
  'nepal':'nepal.jpg','netherlands':'netherlands.jpg',
  'new zealand':'new-zealand.jpg','nicaragua':'nicaragua.jpg',
  'nigeria':'nigeria.jpg','norway':'norway.jpg','oman':'oman.jpg',
  'pakistan':'pakistan.jpg','panama':'panama.jpg','paraguay':'paraguay.jpg',
  'peru':'peru.jpg','philippines':'philippines.jpg','poland':'poland.jpg',
  'portugal':'portugal.jpg','qatar':'qatar.jpg','romania':'romania.jpg',
  'russia':'russia.jpg','rwanda':'rwanda.jpg','saudi arabia':'saudi-arabia.jpg',
  'senegal':'senegal.jpg','serbia':'serbia.jpg','singapore':'singapore.jpg',
  'slovakia':'slovakia.jpg','slovenia':'slovenia.jpg','somalia':'somalia.jpg',
  'south africa':'south-africa.jpg','south korea':'south-korea.jpg',
  'spain':'spain.jpg','sri lanka':'sri-lanka.jpg','suriname':'suriname.jpg',
  'sweden':'sweden.jpg','switzerland':'switzerland.jpg','taiwan':'taiwan.jpg',
  'tanzania':'tanzania.jpg','thailand':'thailand.jpg','tunisia':'tunisia.jpg',
  'turkey':'turkey.jpg','uganda':'uganda.jpg','ukraine':'ukraine.jpg',
  'united arab emirates':'uae.jpg','uae':'uae.jpg','united kingdom':'uk.jpg',
  'uk':'uk.jpg','united states':'usa.jpg','usa':'usa.jpg','uruguay':'uruguay.jpg',
  'uzbekistan':'uzbekistan.jpg','venezuela':'venezuela.jpg','vietnam':'vietnam.jpg',
  'zambia':'zambia.jpg','zimbabwe':'zimbabwe.jpg',
  'dakhla':'morocco.jpg','western sahara':'morocco.jpg',
  'aruba':'aruba.jpg','oranjestad':'aruba.jpg',
  'dominican republic':'dominican-republic.jpg','samana':'dominican-republic.jpg',
  'lihue':'usa-hawaii.jpg','kahului':'usa-hawaii.jpg','hawaii':'usa-hawaii.jpg',
  'st. thomas':'usa.jpg','us virgin islands':'usa.jpg','united states virgin islands':'usa.jpg',
  'san juan':'usa.jpg','puerto rico':'usa.jpg',
  'bonaire':'curacao.jpg'
};

function resolveImage(toArray) {
  const arr = Array.isArray(toArray) ? toArray : [toArray || ''];
  for (const dest of arr) {
    if (!dest) continue;
    const lower = dest.toLowerCase().trim();
    if (DEST_IMAGE_MAP[lower]) return 'images/' + DEST_IMAGE_MAP[lower];
    const cityLower = lower.split(',')[0].trim();
    if (DEST_IMAGE_MAP[cityLower]) return 'images/' + DEST_IMAGE_MAP[cityLower];
    const parts = lower.split(',');
    if (parts[1]) {
      const countryLower = parts[1].trim();
      if (DEST_IMAGE_MAP[countryLower]) return 'images/' + DEST_IMAGE_MAP[countryLower];
    }
  }
  return '';
}

function resolveImageCountryOnly(toArray) {
  const arr = Array.isArray(toArray) ? toArray : [toArray || ''];
  for (const dest of arr) {
    if (!dest || !dest.includes(',')) continue;
    const countryLower = dest.split(',').slice(1).join(',').trim().toLowerCase();
    if (DEST_IMAGE_MAP[countryLower]) return 'images/' + DEST_IMAGE_MAP[countryLower];
  }
  return 'images/earth.jpg';
}

function imgFallback(img) {
  var step = img.dataset.s || '0';
  if (step === '0') {
    img.dataset.s = '1';
    var card = img.parentElement;
    while (card && !card.dataset.country) card = card.parentElement;
    var country = card ? (card.dataset.country || '').trim().toLowerCase() : '';
    if (!country && card) {
      var to = (card.dataset.to || '');
      if (to.includes(',')) country = to.split(',').slice(1).join(',').trim().toLowerCase();
    }
    var countryImg = (country && DEST_IMAGE_MAP[country])
      ? 'images/' + DEST_IMAGE_MAP[country]
      : 'images/earth.jpg';
    img.src = countryImg;
  } else if (step === '1') {
    img.dataset.s = '2';
    img.src = 'images/earth.jpg';
  } else {
    img.onerror = null;
    img.style.display = 'none';
    var ph = img.nextElementSibling;
    if (ph && ph.classList.contains('img-placeholder')) ph.style.display = 'flex';
  }
}

function ddImgFallback(img) {
  var step = img.dataset.fbStep || '0';
  if (step === '0' || step === '') {
    img.dataset.fbStep = '1';
    img.src = img.dataset.fb1 || 'images/earth.jpg';
  } else if (step === '1') {
    img.dataset.fbStep = '2';
    img.src = 'images/earth.jpg';
  } else {
    img.onerror = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const NO_COUNTRY = new Set(['Singapore','Luxembourg','Macau','Hong Kong','Taiwan']);

function ensureCountry(location, allLocations) {
  if (!location) return location;
  if (location.includes(',')) return location;
  const bare = location.trim();
  if (NO_COUNTRY.has(bare)) return bare;
  if (allLocations && Array.isArray(allLocations)) {
    for (const loc of allLocations) {
      if (loc && loc.includes(',')) {
        const country = loc.split(',').slice(1).join(',').trim();
        if (country) return bare + ', ' + country;
      }
    }
  }
  return bare;
}

var COUNTRY_CODES = {
  'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Angola':'AO','Argentina':'AR',
  'Armenia':'AM','Australia':'AU','Austria':'AT','Azerbaijan':'AZ',
  'Bahamas':'BS','Bahrain':'BH','Bangladesh':'BD','Barbados':'BB','Belarus':'BY',
  'Belgium':'BE','Belize':'BZ','Bolivia':'BO','Brazil':'BR','Brunei':'BN',
  'Bulgaria':'BG','Cambodia':'KH','Cameroon':'CM','Canada':'CA','Cape Verde':'CV',
  'Chile':'CL','China':'CN','Colombia':'CO','Congo':'CG','Costa Rica':'CR',
  'Croatia':'HR','Cuba':'CU','Cyprus':'CY','Czech Republic':'CZ',
  'Denmark':'DK','Ecuador':'EC','Egypt':'EG','El Salvador':'SV','Estonia':'EE',
  'Ethiopia':'ET','Fiji':'FJ','Finland':'FI','France':'FR','Gabon':'GA',
  'Georgia':'GE','Germany':'DE','Ghana':'GH','Greece':'GR','Guatemala':'GT',
  'Honduras':'HN','Hungary':'HU','Iceland':'IS','India':'IN','Indonesia':'ID',
  'Iran':'IR','Iraq':'IQ','Ireland':'IE','Israel':'IL','Italy':'IT',
  'Jamaica':'JM','Japan':'JP','Jordan':'JO','Kenya':'KE','Kuwait':'KW',
  'Kyrgyzstan':'KG','Laos':'LA','Latvia':'LV','Lebanon':'LB','Libya':'LY',
  'Lithuania':'LT','Madagascar':'MG','Malawi':'MW','Malaysia':'MY','Maldives':'MV',
  'Mali':'ML','Malta':'MT','Mexico':'MX','Moldova':'MD','Mongolia':'MN',
  'Montenegro':'ME','Morocco':'MA','Mozambique':'MZ','Myanmar':'MM','Namibia':'NA',
  'Nepal':'NP','Netherlands':'NL','New Zealand':'NZ','Nicaragua':'NI',
  'Nigeria':'NG','Norway':'NO','Oman':'OM','Pakistan':'PK','Panama':'PA',
  'Paraguay':'PY','Peru':'PE','Philippines':'PH','Poland':'PL','Portugal':'PT',
  'Qatar':'QA','Romania':'RO','Russia':'RU','Rwanda':'RW','Saudi Arabia':'SA',
  'Senegal':'SN','Serbia':'RS','Sierra Leone':'SL','Slovakia':'SK','Slovenia':'SI',
  'Somalia':'SO','South Africa':'ZA','South Korea':'KR','Spain':'ES',
  'Sri Lanka':'LK','Suriname':'SR','Sweden':'SE','Switzerland':'CH',
  'Tajikistan':'TJ','Tanzania':'TZ','Thailand':'TH','Trinidad and Tobago':'TT',
  'Tunisia':'TN','Turkey':'TR','Uganda':'UG','Ukraine':'UA',
  'United Arab Emirates':'AE','United Kingdom':'GB','United States':'US',
  'Uruguay':'UY','Uzbekistan':'UZ','Venezuela':'VE','Vietnam':'VN',
  'Zambia':'ZM','Zimbabwe':'ZW'
};

function shortenCountry(location) {
  if (!location || !location.includes(',')) return location;
  var parts = location.split(',');
  var city    = parts[0].trim();
  var country = parts.slice(1).join(',').trim();
  var code = COUNTRY_CODES[country];
  return code ? city + ', ' + code : location;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL CARD RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function renderDealsGrid() {
  var grid = document.getElementById('deals-grid');
  if (!grid || !window.DEALS) return;

  var sorted = window.DEALS.slice().sort(function(a, b) { return b.id - a.id; });
  var html = '';
  for (var i = 0; i < sorted.length; i++) {
    var d = sorted[i];
    var fromArr = Array.isArray(d.from) ? d.from : [d.from || ''];
    var toArr   = Array.isArray(d.to)   ? d.to   : [d.to   || ''];
    var from0     = ensureCountry(fromArr[0], fromArr);
    var routeFrom = fromArr.length > 1 ? 'European cities' : from0;
    var to0       = toArr[0] || '';
    var region    = d.region || 'europe';
    var badgeType = d.badge || 'new';
    var badgeText = d.badge === 'hot' ? '&#x1F525; Hot' : d.badge === 'business' ? '&#x2708; Business' : '&#x2728; New';
    var tripType  = d.tripType || 'roundtrip';
    var imgSrc    = resolveImage(toArr) || d.img || 'images/earth.jpg';
    var airline   = Array.isArray(d.airline) ? d.airline[0] : (d.airline || '');
    var posted    = d.posted || '';
    var dataFrom    = from0.toLowerCase();
    var dataTo      = to0.toLowerCase();
    var dataCountry = (to0.indexOf(',') !== -1 ? to0.split(',').slice(1).join(',') : to0).trim().toLowerCase();

    html += '<div data-deal="' + d.id + '" class="deal-card"'
          + ' data-region="' + region + '"'
          + ' data-from="' + dataFrom + '"'
          + ' data-to="' + dataTo + '"'
          + ' data-country="' + dataCountry + '"'
          + ' onclick="openDeal(' + d.id + ')" style="cursor:pointer;">'
          + '<div class="card-img-wrap">'
          + '<img class="card-img" src="' + imgSrc + '" alt="' + to0.replace(/"/g, '&quot;') + '"'
          + ' onerror="imgFallback(this)">'
          + '<div class="img-placeholder" style="display:none;">&#x2708;&#xFE0F;</div>'
          + '<div class="card-img-overlay"></div>'
          + '<div class="card-badge ' + badgeType + '">' + badgeText + '</div>'
          + '<div class="card-price-tag">' + (d.price || '') + '<small>' + tripType + '</small></div>'
          + '</div>'
          + '<div class="card-body">'
          + '<div class="card-arrow">&#x2197;</div>'
          + '<div class="card-route"><span>' + shortenCountry(routeFrom) + '</span><span class="arrow">&rarr;</span><span>' + shortenCountry(to0) + '</span></div>'
          + '<div class="card-title">' + routeFrom + ' to ' + to0 + ' for only ' + (d.price || '') + ' ' + tripType + (airline ? ' with ' + airline : '') + '</div>'
          + '<div class="card-meta"><span>' + airline + '</span><span>' + posted + '</span></div>'
          + '</div>'
          + '</div>';
  }
  grid.innerHTML = html;
  applyAllFilters();
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG GRID RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function renderBlogGrid() {
  var grid = document.getElementById('blog-grid');
  if (!grid || !window.BLOG_POSTS) return;

  var sorted = window.BLOG_POSTS.slice().sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  var html = '';
  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    var excerptMatch = (p.body || '').match(/<p>([\s\S]*?)<\/p>/);
    var excerpt = excerptMatch
      ? excerptMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 160)
      : '';
    var slugAttr = (p.slug || '').replace(/'/g, '');
    html += '<div class="blog-card" onclick="openBlogPost(\'' + slugAttr + '\')">'
          + '<img class="blog-card-img" src="' + (p.img || '') + '" alt="' + (p.cat || '').replace(/"/g, '&quot;') + '">'
          + '<div class="blog-card-body">'
          + '<div class="blog-card-cat">'   + (p.cat   || '') + '</div>'
          + '<div class="blog-card-title">' + (p.title || '') + '</div>'
          + '<p class="blog-card-excerpt">' + excerpt         + '</p>'
          + '<div class="blog-card-meta"><span>' + (p.date || '') + '</span><span>' + (p.readtime || '') + '</span></div>'
          + '</div>'
          + '</div>';
  }
  grid.innerHTML = html;
}

function openBlogPost(slug) {
  const post = (window.BLOG_POSTS || []).find(p => p.slug === slug);
  if (!post) return;
  document.getElementById('blogpost-cat').textContent   = post.cat;
  document.getElementById('blogpost-title').textContent = post.title;
  document.getElementById('blogpost-meta').textContent  = post.date + ' · ' + post.readtime;
  document.getElementById('blogpost-body').innerHTML    = post.body;
  const heroImg  = document.getElementById('blogpost-hero-img');
  const heroWrap = document.getElementById('blogpost-hero-wrap');
  if (post.img) {
    heroImg.src = post.img;
    heroImg.alt = post.title;
    heroWrap.style.display = 'block';
  } else {
    heroWrap.style.display = 'none';
  }
  showPage('blogpost');
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function openDeal(id) {
  const d = (window.DEALS || []).find(x => x.id === id);
  if (!d) return;

  const fromArr    = Array.isArray(d.from) ? d.from : [d.from];
  const toArr      = Array.isArray(d.to)   ? d.to   : [d.to];
  const badgeLabel = d.badgeLabel || (d.badge === 'hot' ? '🔥 Hot Deal' : d.badge === 'business' ? '✈ Business Class' : '✨ New');
  const tripType   = d.tripType || 'roundtrip';
  const exampleDates = d.dates || [];

  const ddImg = document.getElementById('dd-img');
  ddImg.alt            = d.title || '';
  ddImg.src            = 'images/earth.jpg';

  const badge = document.getElementById('dd-badge');
  badge.textContent = badgeLabel;
  badge.className = 'deal-detail-badge ' + (d.badge || 'new');
  document.getElementById('dd-posted').textContent = d.posted ? 'Posted ' + d.posted : '';
  document.getElementById('dd-price').innerHTML = '<small class="dd-price-label">from only</small>' + d.price + '<span>' + tripType + '</span>';
  document.getElementById('dd-route-hero').textContent = ensureCountry(fromArr[0]) + ' → ' + toArr[0];
  document.getElementById('dd-title').textContent = d.title || '';
  document.getElementById('dd-desc').textContent  = d.desc  || '';
  document.getElementById('dd-from').innerHTML = fromArr.map(c => '<span class="deal-detail-city">' + c + '</span>').join('');
  document.getElementById('dd-to').innerHTML   = toArr.map(c   => '<span class="deal-detail-city">' + c + '</span>').join('');
  document.getElementById('dd-dates').innerHTML   = (d.availability || '').replace(/(from|in)/i, '$1<br>');
  document.getElementById('dd-airline').innerHTML = '<strong>' + (d.airline || '') + '</strong>';
  document.getElementById('dd-stops').innerHTML  = '<strong>' + (d.stops || 'Non-stop') + '</strong>';
  document.getElementById('dd-cabin').innerHTML  = '<strong>' + (d.cabin  || 'Economy') + '</strong>';

  const dEl = document.getElementById('dd-example-dates');
  if (exampleDates.length === 0) {
    dEl.className = '';
    dEl.innerHTML = d.bookUrl
      ? '<div class="dd-date-group"><div class="dd-date-chips"><a href="' + d.bookUrl + '" target="_blank" rel="noopener">Search available dates →</a></div></div>'
      : '';
  } else {
    const isGrouped = exampleDates[0] && exampleDates[0].group;
    if (isGrouped) {
      dEl.className = '';
      dEl.innerHTML = exampleDates.map(g =>
        '<div class="dd-date-group">' +
        '<div class="dd-date-group-header">' + g.group + '</div>' +
        '<ul class="deal-detail-dates-list">' +
        g.dates.map(dt => '<li><a href="' + dt.url + '" target="_blank" rel="noopener">' + dt.label + '</a></li>').join('') +
        '</ul></div>'
      ).join('');
    } else {
      dEl.className = 'deal-detail-dates-list';
      dEl.innerHTML = exampleDates.map(e =>
        '<li><a href="' + e.url + '" target="_blank" rel="noopener">' + e.label + '</a></li>'
      ).join('');
    }
  }

  document.getElementById('dd-cta-price').innerHTML = '<span class="cta-from-label">from only</span>' + d.price + '<small>' + tripType + ' / ' + (d.cabin || 'Economy') + '</small>';
  document.getElementById('dd-cta-route').textContent = ensureCountry(fromArr[0]) + ' → ' + toArr[0];
  document.getElementById('dd-cta-btn').href = d.bookUrl || '#';
  document.getElementById('dd-meta-airline').textContent = d.airline || '';
  document.getElementById('dd-meta-cabin').textContent   = d.cabin   || 'Economy';
  document.getElementById('dd-meta-stops').textContent   = d.stops   || 'Non-stop';
  document.getElementById('dd-meta-dates').innerHTML     = (d.availability || '').replace(/(from|in)/i, '$1<br>');
  showPage('deal');
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function showPage(page, pushState) {
  ['main-page','contact-page','terms-page','privacy-page','about-page',
   'qa-page','deal-page','blog-page','blogpost-page'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === page + '-page') ? 'block' : 'none';
  });

  if (page === 'main') {
    document.getElementById('search-from').value = '';
    document.getElementById('search-to').value   = '';
    document.getElementById('search-when').value = '';
    selectedMonth = null;
    const allPill = document.querySelector('.pill[onclick*="\'all\'"]');
    if (allPill) {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      allPill.classList.add('active');
    }
    currentRegion = 'all';
    dealsShown    = 9;
    applyAllFilters();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pushState !== false) {
    try {
      const hash = page === 'main' ? '#' : '#' + page;
      history.pushState({ page: page }, '', hash);
    } catch(e) {}
  }
}
window.showPage = showPage;

function blogPostBack() {
  if (window.history.length > 1) {
    history.back();
  } else {
    showPage('blog');
  }
}

window.addEventListener('popstate', function(e) {
  const page = (e.state && e.state.page) ? e.state.page : 'main';
  showPage(page, false);
});

window.addEventListener('load', function() {
  if (!document.querySelector('#deals-grid .deal-card')) {
    renderDealsGrid();
  }
  renderBlogGrid();
  applyAllFilters();
  try {
    const hash = window.location.hash.replace('#', '');
    if (hash) showPage(hash, false);
    history.replaceState({ page: hash || 'main' }, '', window.location.hash || '#');
  } catch(e) {}
});

// ─────────────────────────────────────────────────────────────────────────────
// Q&A ACCORDION
// ─────────────────────────────────────────────────────────────────────────────
function toggleQA(btn) {
  const answer = btn.nextElementSibling;
  const icon   = btn.querySelector('.qa-icon');
  const isOpen = answer.style.display === 'block';
  answer.style.display = isOpen ? 'none' : 'block';
  icon.classList.toggle('open', !isOpen);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────────────────────────────────────────
async function submitForm() {
  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value;
  const message = document.getElementById('cf-message').value.trim();
  if (!name || !email || !subject || !message) {
    alert('Please fill in all required fields.');
    return;
  }
  const btn = document.querySelector('.submit-btn');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
  if (FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
    console.warn('FlyWell: Formspree ID not configured. Set FORMSPREE_ID in submitForm().');
    document.getElementById('contact-form').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    return;
  }

  try {
    const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });
    if (res.ok) {
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    } else {
      alert('Something went wrong. Please email us directly at hello@flywell.flights');
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }
  } catch(e) {
    alert('Something went wrong. Please email us directly at hello@flywell.flights');
    btn.textContent = 'Send Message';
    btn.disabled = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE CONSENT
// ─────────────────────────────────────────────────────────────────────────────
function _setCookieConsent(val) {
  try { localStorage.setItem('fw_cookie_v2', val); } catch(e) {}
  try {
    var exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    document.cookie = 'fw_cookie_v2=' + val + ';expires=' + exp.toUTCString() + ';path=/;SameSite=Lax';
  } catch(e) {}
}

function _getCookieConsent() {
  try {
    var ls = localStorage.getItem('fw_cookie_v2');
    if (ls) return ls;
  } catch(e) {}
  try {
    var match = document.cookie.match(/fw_cookie_v2=([^;]+)/);
    if (match) return match[1];
  } catch(e) {}
  return null;
}

function acceptCookies(level) {
  _setCookieConsent(level);
  document.getElementById('cookie-banner').style.display = 'none';
}

function openCookiePrefs() {
  try {
    var saved = JSON.parse(localStorage.getItem('fw_cookie_prefs') || '{}');
    ['analytics','functional','marketing'].forEach(function(k) {
      var cb = document.getElementById('pref-' + k);
      if (cb) { cb.checked = !!saved[k]; updateToggle(cb); }
    });
  } catch(e) {}
  document.getElementById('cookie-prefs-overlay').style.display = 'block';
  document.getElementById('cookie-prefs-modal').style.display = 'block';
}

function closeCookiePrefs() {
  document.getElementById('cookie-prefs-overlay').style.display = 'none';
  document.getElementById('cookie-prefs-modal').style.display = 'none';
}

function updateToggle(cb) {
  var key   = cb.id.replace('pref-', '');
  var track = document.getElementById('toggle-' + key);
  var knob  = document.getElementById('knob-'   + key);
  if (!track || !knob) return;
  if (cb.checked) { track.style.background = '#c47f2a'; knob.style.transform = 'translateX(16px)'; }
  else            { track.style.background = 'rgba(40,30,20,0.15)'; knob.style.transform = 'translateX(0)'; }
}

function savePrefs() {
  var prefs = {};
  ['analytics','functional','marketing'].forEach(function(k) {
    var cb = document.getElementById('pref-' + k);
    prefs[k] = cb ? cb.checked : false;
  });
  try { localStorage.setItem('fw_cookie_prefs', JSON.stringify(prefs)); } catch(e) {}
  _setCookieConsent('custom');
  closeCookiePrefs();
  document.getElementById('cookie-banner').style.display = 'none';
}

// Show cookie banner if no consent yet
(function() {
  var consent = _getCookieConsent();
  if (!consent) {
    document.getElementById('cookie-banner').style.display = 'flex';
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
if (window.DEALS && Array.isArray(window.DEALS)) {
  renderDealsGrid();
} else {
  console.error('[FlyWell] window.DEALS not found — check that js/data.js loaded correctly.');
}
renderBlogGrid();
