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
      const sel = selectedMonth.year * 12 + selectedMonth.monthIdx;

      const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      const pairs = [];
      const re = new RegExp('(' + monthNames.join('|') + ')\\s+(\\d{4})', 'g');
      let mt;
      while ((mt = re.exec(availability)) !== null) {
        const mIdx = monthNames.indexOf(mt[1]);
        const yr = parseInt(mt[2]);
        pairs.push(yr * 12 + mIdx);
      }

      if (pairs.length === 0) {
        matchWhen = availability.includes(String(selectedMonth.year));
      } else if (pairs.length === 1) {
        matchWhen = sel === pairs[0];
      } else {
        const rangeStart = Math.min(...pairs);
        const rangeEnd   = Math.max(...pairs);
        matchWhen = sel >= rangeStart && sel <= rangeEnd;
      }
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

  // ── CITIES / SPECIFIC DESTINATIONS ─────────────────────────────────────────

  // Afghanistan
  'kabul':'afghanistan.jpg',
  // Albania
  'tirana':'albania.jpg',
  // Algeria
  'algiers':'algeria.jpg',
  // Angola
  'luanda':'angola.jpg',
  // Antigua
  'st. john\'s':'antigua-and-barbuda.jpg','saint john\'s':'antigua-and-barbuda.jpg',
  // Argentina
  'buenos aires':'argentina-buenos-aires.jpg','mendoza':'argentina.jpg','córdoba':'argentina.jpg','cordoba':'argentina.jpg',
  // Armenia
  'yerevan':'armenia.jpg',
  // Aruba
  'oranjestad':'aruba.jpg',
  // Australia
  'sydney':'australia-sydney.jpg','melbourne':'australia-melbourne.jpg','brisbane':'australia-brisbane.jpg',
  'gold coast':'australia-gold-coast.jpg','perth':'australia.jpg','cairns':'australia.jpg','adelaide':'australia.jpg',
  // Austria
  'vienna':'austria.jpg','wien':'austria.jpg','salzburg':'austria.jpg','innsbruck':'austria.jpg',
  // Azerbaijan
  'baku':'azerbaijan.jpg',
  // Bahamas
  'nassau':'bahamas.jpg','freeport':'bahamas.jpg',
  // Bahrain
  'manama':'bahrain.jpg',
  // Bangladesh
  'dhaka':'bangladesh.jpg',
  // Barbados
  'bridgetown':'barbados.jpg',
  // Belarus
  'minsk':'belarus.jpg',
  // Belgium
  'brussels':'belgium.jpg','bruges':'belgium.jpg','ghent':'belgium.jpg','antwerp':'belgium.jpg',
  // Belize
  'belmopan':'belize.jpg','belize city':'belize.jpg',
  // Benin
  'porto-novo':'benin.jpg','cotonou':'benin.jpg',
  // Bhutan
  'thimphu':'bhutan.jpg','paro':'bhutan.jpg',
  // Bolivia
  'sucre':'bolivia.jpg','la paz':'bolivia.jpg','santa cruz':'bolivia.jpg',
  // Bosnia
  'sarajevo':'bosnia.jpg','mostar':'bosnia.jpg',
  // Botswana
  'gaborone':'botswana.jpg',
  // Brazil
  'brasilia':'brazil.jpg','brasília':'brazil.jpg','sao paulo':'brazil.jpg','são paulo':'brazil.jpg',
  'rio de janeiro':'brazil.jpg','salvador':'brazil.jpg','fortaleza':'brazil.jpg','recife':'brazil.jpg',
  'manaus':'brazil.jpg','belem':'brazil.jpg','belém':'brazil.jpg',
  // Brunei
  'bandar seri begawan':'brunei.jpg',
  // Bulgaria
  'sofia':'bulgaria.jpg','plovdiv':'bulgaria.jpg','varna':'bulgaria.jpg',
  // Burkina Faso
  'ouagadougou':'burkina-faso.jpg',
  // Burundi
  'gitega':'burundi.jpg','bujumbura':'burundi.jpg',
  // Cambodia
  'phnom penh':'cambodia.jpg','siem reap':'cambodia.jpg','angkor wat':'cambodia.jpg',
  // Cameroon
  'yaounde':'cameroon.jpg','yaoundé':'cameroon.jpg','douala':'cameroon.jpg',
  // Canada
  'ottawa':'canada.jpg','toronto':'canada-toronto.jpg','calgary':'canada.jpg',
  'montreal':'canada.jpg','vancouver':'canada.jpg','quebec city':'canada.jpg',
  'edmonton':'canada.jpg','winnipeg':'canada.jpg','halifax':'canada.jpg',
  // Cape Verde
  'sal':'cabo-verde.jpg','praia':'cabo-verde.jpg','mindelo':'cabo-verde.jpg',
  // Cayman Islands
  'george town':'cayman-islands.jpg','grand cayman':'cayman-islands.jpg',
  // Central African Republic
  'bangui':'central-african-republic.jpg',
  // Chad
  "n'djamena":'chad.jpg',
  // Chile
  'santiago':'chile.jpg','valparaíso':'chile.jpg','valparaiso':'chile.jpg',
  // China
  'beijing':'china-beijing.jpg','shanghai':'china-shanghai.jpg','hong kong':'china-hong-kong.jpg',
  'chongqing':'china.jpg','guangzhou':'china.jpg','shenzhen':'china.jpg','xi\'an':'china.jpg',
  "xi'an":'china.jpg','xian':'china.jpg','hangzhou':'china.jpg','chengdu':'china.jpg',
  'kunming':'china.jpg','guilin':'china.jpg','macau':'china.jpg',
  // Colombia
  'bogota':'colombia-bogota.jpg','bogotá':'colombia-bogota.jpg',
  'medellin':'colombia.jpg','medellín':'colombia.jpg',
  'cartagena':'colombia-cartagena.jpg','cali':'colombia.jpg',
  // Comoros
  'moroni':'comoros.jpg',
  // Congo
  'brazzaville':'congo.jpg','kinshasa':'congo.jpg',
  // Costa Rica
  'san jose':'costa-rica.jpg','san josé':'costa-rica.jpg','liberia':'costa-rica.jpg',
  // Croatia
  'zagreb':'croatia.jpg','dubrovnik':'croatia-dubrovnik.jpg','split':'croatia.jpg',
  // Cuba
  'havana':'cuba.jpg','trinidad':'cuba.jpg','varadero':'cuba.jpg',
  // Cuba (city saint) — trinidad is also in Trinidad & Tobago, city first wins
  // Cyprus
  'nicosia':'cyprus.jpg','paphos':'cyprus.jpg','limassol':'cyprus.jpg','larnaca':'cyprus.jpg',
  // Czech Republic
  'prague':'czech-republic.jpg','brno':'czech-republic.jpg',
  // Denmark
  'copenhagen':'denmark.jpg','aarhus':'denmark.jpg',
  // Djibouti
  'djibouti city':'djibouti.jpg','djibouti':'djibouti.jpg',
  // Dominica
  'roseau':'dominica.jpg',
  // Dominican Republic
  'santo domingo':'dominican-republic.jpg','punta cana':'dominican-republic.jpg',
  'samana':'dominican-republic.jpg','samaná':'dominican-republic.jpg',
  'santiago de los caballeros':'dominican-republic.jpg','puerto plata':'dominican-republic.jpg',
  'la romana':'dominican-republic.jpg','bávaro':'dominican-republic.jpg','bavaro':'dominican-republic.jpg',
  // Ecuador
  'quito':'ecuador.jpg','guayaquil':'ecuador.jpg','cuenca':'ecuador.jpg',
  // Egypt
  'cairo':'egypt.jpg','luxor':'egypt.jpg','hurghada':'egypt.jpg','sharm el-sheikh':'egypt.jpg',
  'sharm el sheikh':'egypt.jpg','alexandria':'egypt.jpg','aswan':'egypt.jpg',
  // El Salvador
  'san salvador':'el-salvador.jpg',
  // Eritrea
  'asmara':'eritrea.jpg',
  // Estonia
  'tallinn':'estonia.jpg','tartu':'estonia.jpg',
  // Ethiopia
  'addis ababa':'ethiopia.jpg',
  // Fiji
  'suva':'fiji.jpg','nadi':'fiji.jpg',
  // Finland
  'helsinki':'finland.jpg','rovaniemi':'finland.jpg','tampere':'finland.jpg',
  // France
  'paris':'france-paris.jpg','nice':'france.jpg','lyon':'france.jpg','marseille':'france.jpg',
  'bordeaux':'france.jpg','toulouse':'france.jpg','strasbourg':'france.jpg',
  'nantes':'france.jpg','montpellier':'france.jpg',
  // Gabon
  'libreville':'gabon.jpg',
  // Gambia
  'banjul':'gambia.jpg',
  // Georgia
  'tbilisi':'georgia.jpg','batumi':'georgia.jpg',
  // Germany
  'berlin':'germany-berlin.jpg','frankfurt':'germany.jpg','munich':'germany.jpg',
  'münchen':'germany.jpg','hamburg':'germany.jpg','cologne':'germany.jpg','düsseldorf':'germany.jpg',
  'dusseldorf':'germany.jpg','stuttgart':'germany.jpg','dresden':'germany.jpg',
  // Ghana
  'accra':'ghana.jpg','kumasi':'ghana.jpg',
  // Greece
  'athens':'greece.jpg','thessaloniki':'greece.jpg','santorini':'greece.jpg',
  'mykonos':'greece.jpg','crete':'greece.jpg','heraklion':'greece.jpg','corfu':'greece.jpg',
  'rhodes':'greece.jpg',
  // Guatemala
  'guatemala city':'guatemala.jpg','antigua':'guatemala.jpg',
  // Guinea
  'conakry':'guinea.jpg',
  // Guyana
  'georgetown':'guyana.jpg',
  // Haiti
  'port-au-prince':'haiti.jpg',
  // Hawaii (USA)
  'honolulu':'usa.jpg','kahului':'usa.jpg','kona':'usa.jpg','lihue':'usa.jpg',
  'maui':'usa.jpg','oahu':'usa.jpg','big island':'usa.jpg','hilo':'usa.jpg',
  // Honduras
  'tegucigalpa':'honduras.jpg','roatan':'honduras.jpg',
  // Hungary
  'budapest':'hungary.jpg',
  // Iceland
  'reykjavik':'iceland.jpg','reykjavík':'iceland.jpg',
  // India
  'new delhi':'india.jpg','delhi':'india.jpg','mumbai':'india-mumbai.jpg',
  'goa':'india.jpg','bangalore':'india.jpg','bengaluru':'india.jpg',
  'chennai':'india.jpg','kolkata':'india.jpg','hyderabad':'india.jpg',
  'jaipur':'india.jpg','agra':'india.jpg','varanasi':'india.jpg','kochi':'india.jpg',
  // Indonesia
  'jakarta':'indonesia.jpg','bali':'indonesia-bali.jpg','lombok':'indonesia.jpg',
  'yogyakarta':'indonesia.jpg','surabaya':'indonesia.jpg','komodo':'indonesia.jpg',
  // Iran
  'tehran':'iran.jpg','isfahan':'iran.jpg','shiraz':'iran.jpg',
  // Iraq
  'baghdad':'iraq.jpg','erbil':'iraq.jpg',
  // Ireland
  'dublin':'ireland.jpg','cork':'ireland.jpg','galway':'ireland.jpg',
  // Israel
  'jerusalem':'israel.jpg','tel aviv':'israel.jpg','haifa':'israel.jpg','eilat':'israel.jpg',
  // Italy
  'rome':'italy-rome.jpg','milan':'italy.jpg','venice':'italy.jpg','florence':'italy.jpg',
  'naples':'italy.jpg','bologna':'italy.jpg','turin':'italy.jpg','palermo':'italy.jpg',
  'sicily':'italy.jpg','sardinia':'italy.jpg','amalfi':'italy.jpg','positano':'italy.jpg',
  'cinque terre':'italy.jpg','pisa':'italy.jpg','verona':'italy.jpg',
  // Jamaica
  'kingston':'jamaica.jpg','montego bay':'jamaica.jpg','negril':'jamaica.jpg','ocho rios':'jamaica.jpg',
  // Japan
  'tokyo':'japan-tokyo.jpg','osaka':'japan.jpg','kyoto':'japan.jpg','hiroshima':'japan.jpg',
  'sapporo':'japan.jpg','fukuoka':'japan.jpg','nagoya':'japan.jpg','nara':'japan.jpg',
  // Jordan
  'amman':'jordan.jpg','petra':'jordan.jpg','aqaba':'jordan.jpg',
  // Kazakhstan
  'astana':'kazakhstan.jpg','almaty':'kazakhstan.jpg','nur-sultan':'kazakhstan.jpg',
  // Kenya
  'nairobi':'kenya-nairobi.jpg','mombasa':'kenya.jpg','kisumu':'kenya.jpg','malindi':'kenya.jpg',
  // Kosovo
  'pristina':'kosovo.jpg',
  // Kuwait
  'kuwait city':'kuwait.jpg',
  // Kyrgyzstan
  'bishkek':'kyrgyzstan.jpg',
  // Laos
  'vientiane':'laos.jpg','luang prabang':'laos.jpg',
  // Latvia
  'riga':'latvia.jpg',
  // Lebanon
  'beirut':'lebanon.jpg',
  // Libya
  'tripoli':'libya.jpg',
  // Lithuania
  'vilnius':'lithuania.jpg',
  // Luxembourg
  'luxembourg city':'luxembourg.jpg',
  // Madagascar
  'antananarivo':'madagascar.jpg',
  // Malawi
  'lilongwe':'malawi.jpg',
  // Malaysia
  'kuala lumpur':'malaysia.jpg','penang':'malaysia.jpg','langkawi':'malaysia.jpg',
  'kota kinabalu':'malaysia.jpg','george town':'malaysia.jpg',
  // Maldives
  'male':'maldives.jpg','malé':'maldives.jpg',
  // Mali
  'bamako':'mali.jpg',
  // Malta
  'valletta':'malta.jpg',
  // Mauritius
  'port louis':'mauritius.jpg',
  // Mexico
  'mexico city':'mexico.jpg','cancun':'mexico-cancun.jpg','cancún':'mexico-cancun.jpg',
  'guadalajara':'mexico.jpg','monterrey':'mexico.jpg','tulum':'mexico.jpg',
  'playa del carmen':'mexico.jpg','oaxaca':'mexico.jpg','puerto vallarta':'mexico.jpg',
  'cabo san lucas':'mexico.jpg','san miguel de allende':'mexico.jpg','mérida':'mexico.jpg',
  'merida':'mexico.jpg','tijuana':'mexico.jpg',
  // Moldova
  'chisinau':'moldova.jpg','chișinău':'moldova.jpg',
  // Mongolia
  'ulaanbaatar':'mongolia.jpg',
  // Montenegro
  'podgorica':'montenegro.jpg','kotor':'montenegro.jpg','budva':'montenegro.jpg',
  // Morocco
  'rabat':'morocco.jpg','marrakech':'morocco-marrakech.jpg','casablanca':'morocco.jpg',
  'fez':'morocco.jpg','fès':'morocco.jpg','tangier':'morocco.jpg','agadir':'morocco.jpg',
  // Mozambique
  'maputo':'mozambique.jpg',
  // Myanmar
  'yangon':'myanmar.jpg','naypyidaw':'myanmar.jpg','bagan':'myanmar.jpg','mandalay':'myanmar.jpg',
  // Namibia
  'windhoek':'namibia.jpg',
  // Nepal
  'kathmandu':'nepal.jpg','pokhara':'nepal.jpg',
  // Netherlands
  'amsterdam':'netherlands-amsterdam.jpg','rotterdam':'netherlands.jpg',
  'the hague':'netherlands.jpg','\'s-hertogenbosch':'netherlands.jpg','utrecht':'netherlands.jpg',
  // New Zealand
  'wellington':'new-zealand.jpg','auckland':'new-zealand.jpg','queenstown':'new-zealand.jpg',
  'christchurch':'new-zealand.jpg',
  // Nicaragua
  'managua':'nicaragua.jpg','granada':'nicaragua.jpg',
  // Nigeria
  'abuja':'nigeria.jpg','lagos':'nigeria.jpg','kano':'nigeria.jpg',
  // North Macedonia
  'skopje':'north-macedonia.jpg',
  // Norway
  'oslo':'norway.jpg','bergen':'norway.jpg','tromsø':'norway.jpg','tromso':'norway.jpg',
  'stavanger':'norway.jpg',
  // Oman
  'muscat':'oman.jpg',
  // Pakistan
  'islamabad':'pakistan.jpg','karachi':'pakistan.jpg','lahore':'pakistan.jpg',
  // Panama
  'panama city':'panama.jpg',
  // Paraguay
  'asuncion':'paraguay.jpg','asunción':'paraguay.jpg',
  // Peru
  'lima':'peru-lima.jpg','machu picchu':'peru.jpg','cusco':'peru.jpg','cuzco':'peru.jpg',
  'arequipa':'peru.jpg',
  // Philippines
  'manila':'philippines.jpg','cebu':'philippines.jpg','boracay':'philippines.jpg',
  'palawan':'philippines.jpg','davao':'philippines.jpg',
  // Poland
  'warsaw':'poland.jpg','krakow':'poland.jpg','kraków':'poland.jpg','gdansk':'poland.jpg',
  'gdańsk':'poland.jpg','wroclaw':'poland.jpg','wrocław':'poland.jpg',
  // Portugal
  'lisbon':'portugal-lisbon.jpg','porto':'portugal.jpg','faro':'portugal.jpg',
  'madeira':'portugal.jpg','algarve':'portugal.jpg','funchal':'portugal.jpg',
  // Puerto Rico (USA)
  'san juan':'usa.jpg',
  // Qatar
  'doha':'qatar.jpg',
  // Romania
  'bucharest':'romania.jpg','cluj-napoca':'romania.jpg','brasov':'romania.jpg',
  'brașov':'romania.jpg','sibiu':'romania.jpg',
  // Russia
  'moscow':'russia.jpg','st. petersburg':'russia.jpg','saint petersburg':'russia.jpg',
  'vladivostok':'russia.jpg',
  // Rwanda
  'kigali':'rwanda.jpg',
  // Saudi Arabia
  'riyadh':'saudi-arabia.jpg','jeddah':'saudi-arabia.jpg','mecca':'saudi-arabia.jpg',
  'medina':'saudi-arabia.jpg',
  // Senegal
  'dakar':'senegal.jpg',
  // Serbia
  'belgrade':'serbia.jpg','novi sad':'serbia.jpg',
  // Sierra Leone
  'freetown':'sierra-leone.jpg',
  // Singapore
  'singapore':'singapore.jpg',
  // Slovakia
  'bratislava':'slovakia.jpg',
  // Slovenia
  'ljubljana':'slovenia.jpg','bled':'slovenia.jpg',
  // Somalia
  'mogadishu':'somalia.jpg',
  // South Africa
  'cape town':'south-africa-cape-town.jpg','johannesburg':'south-africa.jpg',
  'durban':'south-africa.jpg','pretoria':'south-africa.jpg',
  // South Korea
  'seoul':'south-korea-seoul.jpg','busan':'south-korea.jpg','incheon':'south-korea.jpg',
  // Spain
  'madrid':'spain-madrid.jpg','barcelona':'spain-barcelona.jpg','seville':'spain.jpg',
  'sevilla':'spain.jpg','valencia':'spain.jpg','malaga':'spain.jpg','málaga':'spain.jpg',
  'ibiza':'spain.jpg','mallorca':'spain.jpg','palma':'spain.jpg','bilbao':'spain.jpg',
  'granada':'spain.jpg','tenerife':'spain.jpg','gran canaria':'spain.jpg',
  'lanzarote':'spain.jpg','fuerteventura':'spain.jpg',
  // Sri Lanka
  'colombo':'sri-lanka.jpg','kandy':'sri-lanka.jpg','galle':'sri-lanka.jpg',
  // Suriname
  'paramaribo':'suriname.jpg',
  // Sweden
  'stockholm':'sweden-stockholm.jpg','gothenburg':'sweden.jpg','göteborg':'sweden.jpg',
  'malmo':'sweden.jpg','malmö':'sweden.jpg',
  // Switzerland
  'bern':'switzerland.jpg','zurich':'switzerland.jpg','zürich':'switzerland.jpg',
  'geneva':'switzerland.jpg','genève':'switzerland.jpg','lausanne':'switzerland.jpg',
  'interlaken':'switzerland.jpg','lucerne':'switzerland.jpg','basel':'switzerland.jpg',
  // Taiwan
  'taipei':'taiwan.jpg','taichung':'taiwan.jpg','kaohsiung':'taiwan.jpg',
  // Tajikistan
  'dushanbe':'tajikistan.jpg',
  // Tanzania
  'dar es salaam':'tanzania.jpg','zanzibar':'tanzania.jpg','arusha':'tanzania.jpg',
  // Thailand
  'bangkok':'thailand-bangkok.jpg','phuket':'thailand-phuket.jpg',
  'chiang mai':'thailand.jpg','pattaya':'thailand.jpg','ko samui':'thailand.jpg',
  'koh samui':'thailand.jpg','krabi':'thailand.jpg','chiang rai':'thailand.jpg',
  // Trinidad and Tobago
  'port of spain':'trinidad-and-tobago.jpg',
  // Tunisia
  'tunis':'tunisia.jpg','sfax':'tunisia.jpg','sousse':'tunisia.jpg',
  'djerba':'tunisia.jpg','dakhla':'tunisia.jpg',
  // Turkey
  'istanbul':'turkey-istanbul.jpg','ankara':'turkey.jpg','antalya':'turkey.jpg',
  'izmir':'turkey.jpg','cappadocia':'turkey.jpg','bodrum':'turkey.jpg',
  'trabzon':'turkey.jpg',
  // Uganda
  'kampala':'uganda.jpg',
  // Ukraine
  'kyiv':'ukraine.jpg','odessa':'ukraine.jpg','lviv':'ukraine.jpg',
  // United Arab Emirates
  'dubai':'uae-dubai.jpg','abu dhabi':'uae.jpg','sharjah':'uae.jpg',
  // United Kingdom
  'london':'uk-london.jpg','edinburgh':'uk.jpg','manchester':'uk.jpg',
  'birmingham':'uk.jpg','glasgow':'uk.jpg','liverpool':'uk.jpg',
  'bristol':'uk.jpg','leeds':'uk.jpg','cardiff':'uk.jpg','belfast':'uk.jpg',
  'bath':'uk.jpg','oxford':'uk.jpg','cambridge':'uk.jpg',
  // United States
  'new york':'usa-new-york.jpg','new york city':'usa-new-york.jpg',
  'new york jfk':'usa-new-york.jpg','nyc':'usa-new-york.jpg',
  'chicago':'usa-chicago.jpg','los angeles':'usa.jpg','miami':'usa.jpg',
  'las vegas':'usa.jpg','washington':'usa.jpg','washington dc':'usa.jpg',
  'seattle':'usa.jpg','boston':'usa.jpg','denver':'usa.jpg','orlando':'usa.jpg',
  'austin':'usa.jpg','dallas':'usa.jpg','philadelphia':'usa.jpg',
  'charlotte':'usa.jpg','houston':'usa.jpg','atlanta':'usa.jpg',
  'nashville':'usa.jpg','portland':'usa.jpg','phoenix':'usa.jpg',
  'san francisco':'usa.jpg','san diego':'usa.jpg','sacramento':'usa.jpg',
  'minneapolis':'usa.jpg','detroit':'usa.jpg','new orleans':'usa.jpg',
  'baltimore':'usa.jpg','tampa':'usa.jpg','fort lauderdale':'usa.jpg',
  'san antonio':'usa.jpg','columbus':'usa.jpg','indianapolis':'usa.jpg',
  'melbourne, florida':'usa.jpg','melbourne, florida, usa':'usa.jpg',
  // Uruguay
  'montevideo':'uruguay.jpg','punta del este':'uruguay.jpg',
  // US Virgin Islands
  'st. thomas':'usa.jpg','saint thomas':'usa.jpg','st. croix':'usa.jpg',
  'charlotte amalie':'usa.jpg',
  // Uzbekistan
  'tashkent':'uzbekistan.jpg','samarkand':'uzbekistan.jpg','bukhara':'uzbekistan.jpg',
  // Venezuela
  'caracas':'venezuela.jpg',
  // Vietnam
  'hanoi':'vietnam.jpg','ho chi minh city':'vietnam.jpg','ho chi minh':'vietnam.jpg',
  'saigon':'vietnam.jpg','da nang':'vietnam.jpg','hoi an':'vietnam.jpg',
  'nha trang':'vietnam.jpg','hue':'vietnam.jpg',
  // Western Sahara
  'dakhla, western sahara':'morocco.jpg',
  // Yemen
  'sanaa':'yemen.jpg','sana\'a':'yemen.jpg',
  // Zambia
  'lusaka':'zambia.jpg','livingstone':'zambia.jpg',
  // Zimbabwe
  'harare':'zimbabwe.jpg','victoria falls':'zimbabwe.jpg',

  // ── COUNTRY FALLBACKS (every country in the world) ─────────────────────────
  // These catch any city not listed above via the country portion of "City, Country"

  'afghanistan':'afghanistan.jpg',
  'albania':'albania.jpg',
  'algeria':'algeria.jpg',
  'andorra':'andorra.jpg',
  'angola':'angola.jpg',
  'antigua and barbuda':'antigua-and-barbuda.jpg','antigua & barbuda':'antigua-and-barbuda.jpg',
  'argentina':'argentina.jpg',
  'armenia':'armenia.jpg',
  'aruba':'aruba.jpg',
  'australia':'australia.jpg',
  'austria':'austria.jpg',
  'azerbaijan':'azerbaijan.jpg',
  'bahamas':'bahamas.jpg',
  'bahrain':'bahrain.jpg',
  'bangladesh':'bangladesh.jpg',
  'barbados':'barbados.jpg',
  'belarus':'belarus.jpg',
  'belgium':'belgium.jpg',
  'belize':'belize.jpg',
  'benin':'benin.jpg',
  'bhutan':'bhutan.jpg',
  'bolivia':'bolivia.jpg',
  'bosnia and herzegovina':'bosnia.jpg','bosnia & herzegovina':'bosnia.jpg','bosnia':'bosnia.jpg',
  'botswana':'botswana.jpg',
  'brazil':'brazil.jpg',
  'brunei':'brunei.jpg','brunei darussalam':'brunei.jpg',
  'bulgaria':'bulgaria.jpg',
  'burkina faso':'burkina-faso.jpg',
  'burundi':'burundi.jpg',
  'cabo verde':'cabo-verde.jpg','cape verde':'cabo-verde.jpg',
  'cambodia':'cambodia.jpg',
  'cameroon':'cameroon.jpg',
  'canada':'canada.jpg',
  'cayman islands':'cayman-islands.jpg',
  'central african republic':'central-african-republic.jpg',
  'chad':'chad.jpg',
  'chile':'chile.jpg',
  'china':'china.jpg',
  'colombia':'colombia.jpg',
  'comoros':'comoros.jpg',
  'congo':'congo.jpg','democratic republic of the congo':'congo.jpg','dr congo':'congo.jpg',
  'republic of the congo':'congo.jpg',
  'costa rica':'costa-rica.jpg',
  'croatia':'croatia.jpg',
  'cuba':'cuba.jpg',
  'curacao':'curacao.jpg','curaçao':'curacao.jpg',
  'cyprus':'cyprus.jpg',
  'czech republic':'czech-republic.jpg','czechia':'czech-republic.jpg',
  'denmark':'denmark.jpg',
  'djibouti':'djibouti.jpg',
  'dominica':'dominica.jpg',
  'dominican republic':'dominican-republic.jpg',
  'ecuador':'ecuador.jpg',
  'egypt':'egypt.jpg',
  'el salvador':'el-salvador.jpg',
  'equatorial guinea':'equatorial-guinea.jpg',
  'eritrea':'eritrea.jpg',
  'estonia':'estonia.jpg',
  'eswatini':'eswatini.jpg','swaziland':'eswatini.jpg',
  'ethiopia':'ethiopia.jpg',
  'fiji':'fiji.jpg',
  'finland':'finland.jpg',
  'france':'france.jpg',
  'gabon':'gabon.jpg',
  'gambia':'gambia.jpg','the gambia':'gambia.jpg',
  'georgia':'georgia.jpg',
  'germany':'germany.jpg',
  'ghana':'ghana.jpg',
  'greece':'greece.jpg',
  'grenada':'grenada.jpg',
  'guatemala':'guatemala.jpg',
  'guinea':'guinea.jpg',
  'guinea-bissau':'guinea-bissau.jpg',
  'guyana':'guyana.jpg',
  'haiti':'haiti.jpg',
  'honduras':'honduras.jpg',
  'hungary':'hungary.jpg',
  'iceland':'iceland.jpg',
  'india':'india.jpg',
  'indonesia':'indonesia.jpg',
  'iran':'iran.jpg',
  'iraq':'iraq.jpg',
  'ireland':'ireland.jpg',
  'israel':'israel.jpg',
  'italy':'italy.jpg',
  'ivory coast':'ivory-coast.jpg','côte d\'ivoire':'ivory-coast.jpg','cote d\'ivoire':'ivory-coast.jpg',
  'jamaica':'jamaica.jpg',
  'japan':'japan.jpg',
  'jordan':'jordan.jpg',
  'kazakhstan':'kazakhstan.jpg',
  'kenya':'kenya.jpg',
  'kosovo':'kosovo.jpg',
  'kuwait':'kuwait.jpg',
  'kyrgyzstan':'kyrgyzstan.jpg',
  'laos':'laos.jpg',
  'latvia':'latvia.jpg',
  'lebanon':'lebanon.jpg',
  'lesotho':'lesotho.jpg',
  'liberia':'liberia.jpg',
  'libya':'libya.jpg',
  'liechtenstein':'liechtenstein.jpg',
  'lithuania':'lithuania.jpg',
  'luxembourg':'luxembourg.jpg',
  'madagascar':'madagascar.jpg',
  'malawi':'malawi.jpg',
  'malaysia':'malaysia.jpg',
  'maldives':'maldives.jpg',
  'mali':'mali.jpg',
  'malta':'malta.jpg',
  'mauritania':'mauritania.jpg',
  'mauritius':'mauritius.jpg',
  'mexico':'mexico.jpg',
  'moldova':'moldova.jpg',
  'mongolia':'mongolia.jpg',
  'montenegro':'montenegro.jpg',
  'morocco':'morocco.jpg',
  'mozambique':'mozambique.jpg',
  'myanmar':'myanmar.jpg','burma':'myanmar.jpg',
  'namibia':'namibia.jpg',
  'nepal':'nepal.jpg',
  'netherlands':'netherlands.jpg','holland':'netherlands.jpg',
  'new zealand':'new-zealand.jpg',
  'nicaragua':'nicaragua.jpg',
  'niger':'niger.jpg',
  'nigeria':'nigeria.jpg',
  'north korea':'north-korea.jpg',
  'north macedonia':'north-macedonia.jpg',
  'norway':'norway.jpg',
  'oman':'oman.jpg',
  'pakistan':'pakistan.jpg',
  'panama':'panama.jpg',
  'papua new guinea':'papua-new-guinea.jpg',
  'paraguay':'paraguay.jpg',
  'peru':'peru.jpg',
  'philippines':'philippines.jpg',
  'poland':'poland.jpg',
  'portugal':'portugal.jpg',
  'qatar':'qatar.jpg',
  'romania':'romania.jpg',
  'russia':'russia.jpg','russian federation':'russia.jpg',
  'rwanda':'rwanda.jpg',
  'saint kitts and nevis':'saint-kitts-and-nevis.jpg',
  'saint lucia':'saint-lucia.jpg','st. lucia':'saint-lucia.jpg','st lucia':'saint-lucia.jpg',
  'saint vincent and the grenadines':'saint-vincent.jpg',
  'samoa':'samoa.jpg',
  'saudi arabia':'saudi-arabia.jpg',
  'senegal':'senegal.jpg',
  'serbia':'serbia.jpg',
  'seychelles':'seychelles.jpg',
  'sierra leone':'sierra-leone.jpg',
  'singapore':'singapore.jpg',
  'slovakia':'slovakia.jpg',
  'slovenia':'slovenia.jpg',
  'solomon islands':'solomon-islands.jpg',
  'somalia':'somalia.jpg',
  'south africa':'south-africa.jpg',
  'south korea':'south-korea.jpg',
  'south sudan':'south-sudan.jpg',
  'spain':'spain.jpg',
  'sri lanka':'sri-lanka.jpg',
  'sudan':'sudan.jpg',
  'suriname':'suriname.jpg',
  'sweden':'sweden.jpg',
  'switzerland':'switzerland.jpg',
  'syria':'syria.jpg',
  'taiwan':'taiwan.jpg',
  'tajikistan':'tajikistan.jpg',
  'tanzania':'tanzania.jpg',
  'thailand':'thailand.jpg',
  'timor-leste':'timor-leste.jpg','east timor':'timor-leste.jpg',
  'togo':'togo.jpg',
  'tonga':'tonga.jpg',
  'trinidad and tobago':'trinidad-and-tobago.jpg','trinidad & tobago':'trinidad-and-tobago.jpg',
  'tunisia':'tunisia.jpg',
  'turkey':'turkey.jpg','türkiye':'turkey.jpg',
  'turkmenistan':'turkmenistan.jpg',
  'uganda':'uganda.jpg',
  'ukraine':'ukraine.jpg',
  'united arab emirates':'uae.jpg','uae':'uae.jpg',
  'united kingdom':'uk.jpg','uk':'uk.jpg','great britain':'uk.jpg','britain':'uk.jpg',
  'united states':'usa.jpg','usa':'usa.jpg','us virgin islands':'usa.jpg',
  'uruguay':'uruguay.jpg',
  'uzbekistan':'uzbekistan.jpg',
  'vanuatu':'vanuatu.jpg',
  'venezuela':'venezuela.jpg',
  'vietnam':'vietnam.jpg','viet nam':'vietnam.jpg',
  'western sahara':'morocco.jpg',
  'yemen':'yemen.jpg',
  'zambia':'zambia.jpg',
  'zimbabwe':'zimbabwe.jpg'
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
