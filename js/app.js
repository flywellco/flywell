// ─────────────────────────────────────────────────────────────────────────────
// MONTH PICKER
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let pickerYear = new Date().getFullYear();
let dealsShown = 9;
let currentRegion = 'all';
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
  dealsShown = 9;
  applyAllFilters();
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
  dealsShown = 9;
  applyAllFilters();
}

function toggleMonthPicker(e) {
  if (e) e.stopPropagation();
  if (pickerVisible) { pickerEl.style.display = 'none'; pickerVisible = false; return; }
  const input = document.getElementById('search-when');
  const rect = input.getBoundingClientRect();
  pickerEl.style.display = 'block';
  renderMonthGrid();
  const pickerWidth  = pickerEl.offsetWidth;
  const pickerHeight = pickerEl.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // On very small screens, center the picker on screen
  if (vw < 400) {
    pickerEl.style.position = 'fixed';
    pickerEl.style.left = Math.max(8, (vw - pickerWidth) / 2) + 'px';
    pickerEl.style.top  = Math.max(8, (vh - pickerHeight) / 2) + 'px';
  } else {
    pickerEl.style.position = 'fixed';
    let left = rect.left;
    // Flip left if overflowing right edge
    if (left + pickerWidth > vw - 8) left = vw - pickerWidth - 8;
    if (left < 8) left = 8;
    // Flip above input if not enough room below
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    let top;
    if (spaceBelow >= pickerHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
    } else {
      top = rect.top - pickerHeight - 8;
    }
    if (top < 8) top = 8;
    pickerEl.style.left = left + 'px';
    pickerEl.style.top  = top + 'px';
  }
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

function applyAllFilters() {
  const cards = document.querySelectorAll('#deals-grid .deal-card');
  // CHANGE 1: read from single merged FROM/TO field
  const query = (document.getElementById('search-from-to') ? document.getElementById('search-from-to').value : '').toLowerCase().trim();

  const filtered = [];
  cards.forEach(card => {
    const regions  = (card.dataset.region  || '').split(' ');
    const fromData = (card.dataset.from    || '');
    const toData   = (card.dataset.to      || '');
    const country  = (card.dataset.country || '');

    const matchRegion = currentRegion === 'all' || regions.includes(currentRegion);
    const matchFromTo = !query || fromData.includes(query) || toData.includes(query) || country.includes(query);

    let matchWhen = true;
    if (selectedMonth) {
      const deal = (window.DEALS || []).find(d => String(d.id) === String(card.dataset.deal));
      const availability = deal ? (deal.availability || '').toLowerCase() : '';
      const monthName = MONTHS_FULL[selectedMonth.monthIdx].toLowerCase();
      const year = String(selectedMonth.year);
      matchWhen = availability.includes(monthName) && availability.includes(year);
    }

    if (matchRegion && matchFromTo && matchWhen) filtered.push(card);
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

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  const input = document.getElementById('search-from-to');
  if (!input) return;

  // Build suggestion list from actual deal data (cities + countries from/to)
  function buildSuggestions() {
    const all = window.DEALS || [];
    const seen = new Set();
    const list = [];
    all.forEach(d => {
      const froms = Array.isArray(d.from) ? d.from : [d.from || ''];
      const tos   = Array.isArray(d.to)   ? d.to   : [d.to   || ''];
      [...froms, ...tos].forEach(loc => {
        if (!loc) return;
        // Add full "City, Country"
        const full = loc.trim();
        if (full && !seen.has(full.toLowerCase())) { seen.add(full.toLowerCase()); list.push(full); }
        // Add just city
        const city = full.split(',')[0].trim();
        if (city && !seen.has(city.toLowerCase())) { seen.add(city.toLowerCase()); list.push(city); }
        // Add just country
        if (full.includes(',')) {
          const country = full.split(',').slice(1).join(',').trim();
          if (country && !seen.has(country.toLowerCase())) { seen.add(country.toLowerCase()); list.push(country); }
        }
      });
    });
    return list.sort((a, b) => a.localeCompare(b));
  }

  // Create dropdown element
  const dropdown = document.createElement('ul');
  dropdown.id = 'search-autocomplete';
  dropdown.style.cssText = [
    'position:absolute','top:100%','left:0','right:0','z-index:9998',
    'background:#fff','border:1px solid rgba(40,30,20,0.14)',
    'border-radius:10px','box-shadow:0 12px 40px rgba(0,0,0,0.18)',
    'margin:4px 0 0','padding:4px 0','list-style:none',
    'max-height:220px','overflow-y:auto','display:none'
  ].join(';');
  input.parentElement.appendChild(dropdown);

  let suggestions = [];
  let activeIdx = -1;

  function showDropdown(items) {
    activeIdx = -1;
    dropdown.innerHTML = '';
    if (!items.length) { dropdown.style.display = 'none'; return; }
    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.cssText = 'padding:0.55rem 1rem;cursor:pointer;font-family:DM Sans,sans-serif;font-size:0.88rem;color:#1c1612;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      li.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent blur firing before click
        selectSuggestion(item);
      });
      li.addEventListener('touchend', e => {
        e.preventDefault();
        selectSuggestion(item);
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = 'block';
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
    activeIdx = -1;
  }

  function highlightItem(idx) {
    const items = dropdown.querySelectorAll('li');
    items.forEach((li, i) => {
      li.style.background = i === idx ? 'rgba(196,127,42,0.1)' : '';
      li.style.color = i === idx ? '#c47f2a' : '#1c1612';
    });
  }

  function selectSuggestion(value) {
    input.value = value;
    hideDropdown();
    input.blur(); // dismiss mobile keyboard
    dealsShown = 9;
    applyAllFilters();
  }

  // Input handler — filter suggestions
  input.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    if (q.length < 2) { hideDropdown(); return; }
    if (!suggestions.length) suggestions = buildSuggestions();
    const matches = suggestions.filter(s => s.toLowerCase().startsWith(q)).slice(0, 8);
    // If no startsWith matches, fall back to includes
    const results = matches.length
      ? matches
      : suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
    showDropdown(results);
  });

  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('li');
    if (dropdown.style.display === 'block' && items.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        highlightItem(activeIdx);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, -1);
        highlightItem(activeIdx);
        return;
      }
      if (e.key === 'Enter') {
        if (activeIdx >= 0 && items[activeIdx]) {
          selectSuggestion(items[activeIdx].textContent);
          return;
        }
      }
      if (e.key === 'Escape') { hideDropdown(); return; }
    }
    if (e.key === 'Enter') { hideDropdown(); dealsShown = 9; applyAllFilters(); }
  });

  // Hide on blur (small delay so mousedown/touchend fires first)
  input.addEventListener('blur', () => setTimeout(hideDropdown, 150));

  // Hide if user clicks outside
  document.addEventListener('click', e => {
    if (e.target !== input && !dropdown.contains(e.target)) hideDropdown();
  });
})();

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

  const refInput = document.getElementById('nav-search-input') || document.activeElement;
  const wrap = refInput ? (refInput.closest('.nav-search-wrap') || refInput) : document.body;
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


function _doNavSearchGo(val) {
  showPage('main');
  // CHANGE 3: populate the single merged field
  const fromToEl = document.getElementById('search-from-to');
  if (fromToEl) fromToEl.value = val;
  document.getElementById('nav-search-input').value = '';
  const resultsEl = document.getElementById('nav-search-results');
  if (resultsEl) resultsEl.style.display = 'none';
  setTimeout(() => {
    runSearch();
    document.getElementById('deals-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

document.addEventListener('click', (e) => {
  const resultsEl = document.getElementById('nav-search-results');
  const navInput = document.getElementById('nav-search-input');
  if (resultsEl && !resultsEl.contains(e.target) && e.target !== navInput) {
    resultsEl.style.display = 'none';
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION IMAGE MAP
// ─────────────────────────────────────────────────────────────────────────────
const DEST_IMAGE_MAP = {
  'algiers':'algeria.jpg','algeria':'algeria.jpg',
  'antigua':'antigua-barbuda.jpg','barbuda':'antigua-barbuda.jpg','antigua and barbuda':'antigua-barbuda.jpg',
  'buenos aires':'argentina-buenos-aires.jpg','argentina':'argentina.jpg',
  'yerevan':'armenia.jpg','armenia':'armenia.jpg',
  'oranjestad':'aruba.jpg','aruba':'aruba.jpg',
  'brisbane':'australia-brisbane.jpg','gold coast':'australia-gold-coast.jpg',
  'melbourne':'australia-melbourne.jpg','sydney':'australia-sydney.jpg','australia':'australia.jpg',
  'vienna':'austria.jpg','austria':'austria.jpg',
  'baku':'azerbaijan.jpg','azerbaijan':'azerbaijan.jpg',
  'nassau':'bahamas.jpg','bahamas':'bahamas.jpg',
  'manama':'bahrain.jpg','bahrain':'bahrain.jpg',
  'bridgetown':'barbados.jpg','barbados':'barbados.jpg',
  'brussels':'belgium.jpg','belgium':'belgium.jpg',
  'belize city':'belize.jpg','belize':'belize.jpg',
  'hamilton':'bermuda.jpg','bermuda':'bermuda.jpg',
  'thimphu':'stan.jpg','bhutan':'stan.jpg',
  'la paz':'bolivia.jpg','bolivia':'bolivia.jpg',
  'sarajevo':'bosnia-herzegovina.jpg','bosnia':'bosnia-herzegovina.jpg','bosnia and herzegovina':'bosnia-herzegovina.jpg',
  'gaborone':'botswana.jpg','botswana':'botswana.jpg',
  'rio de janeiro':'brazil-rio-de-janeiro.jpg','sao paulo':'brazil-sao-paolo.jpg',
  'iguazu':'brazil-iguacu.jpg','brazil':'brazil.jpg',
  'road town':'british-virign-islands.jpg','british virgin islands':'british-virign-islands.jpg',
  'bandar seri begawan':'brunei.jpg','brunei':'brunei.jpg',
  'phnom penh':'cambodia-beach.jpg','siem reap':'cambodia-angkor.jpg','cambodia':'cambodia-angkor.jpg',
  'ottawa':'canada-otawa.jpg','toronto':'canada-toronto.jpg','vancouver':'canada-vancouver.jpg','canada':'canada.jpg',
  'sal':'cape-verde.jpg','praia':'cape-verde.jpg','cape verde':'cape-verde.jpg','cabo verde':'cape-verde.jpg',
  'george town':'cayman-islands.jpg','cayman islands':'cayman-islands.jpg',
  'santiago':'chile-santiago.jpg','chile':'chile-santiago.jpg',
  'beijing':'china-beijing.jpg','shanghai':'china-shanghai.jpg','chongqing':'china.jpg',
  'guangzhou':'china.jpg','china':'china.jpg',
  'hong kong':'hong-kong.jpg',
  'bogota':'colombia-bogota.jpg','cartagena':'colombia-cartagena.jpg','colombia':'colombia.jpg',
  'san jose':'costa-rica.jpg','costa rica':'costa-rica.jpg',
  'dubrovnik':'croatia-dubrovnik.jpg','split':'croatia-split.jpg','zagreb':'croatia.jpg','croatia':'croatia.jpg',
  'varadero':'cub-varadero.jpg','havana':'cuba-havana.jpg','cuba':'cuba.jpg',
  'willemstad':'curacao.jpg','curacao':'curacao.jpg','bonaire':'curacao.jpg',
  'copenhagen':'denmark.jpg','denmark':'denmark.jpg',
  'dhaka':'dhaka.jpg','bangladesh':'dhaka.jpg',
  'roseau':'dominica.jpg','dominica':'dominica.jpg',
  'santo domingo':'dominican-republic.jpg','punta cana':'dominican-republic.jpg',
  'samana':'dominican-republic.jpg','dominican republic':'dominican-republic.jpg',
  'cairo':'egypt-cairo.jpg','sharm el sheikh':'egypt-sharm-el-sheikh.jpg','egypt':'egypt.jpg',
  'asmara':'eritrea.jpg','eritrea':'eritrea.jpg',
  'tallinn':'estonia.jpg','estonia':'estonia.jpg',
  'suva':'fiji.jpg','fiji':'fiji.jpg',
  'helsinki':'finland-winter.jpg','finland':'finland-winter.jpg',
  'nice':'france-nice.jpg','paris':'france-paris.jpg','france':'france.jpg',
  'tbilisi':'georgia.jpg','georgia':'georgia.jpg',
  'berlin':'germany-berlin.jpg','frankfurt':'germany.jpg','munich':'germany.jpg','germany':'germany.jpg',
  "st george's":'greanada-island.jpg','grenada':'greanada-island.jpg',
  'athens':'greece-athens.jpg','mykonos':'greece-mykonos.jpg','santorini':'greece-santorini.jpg',
  'thessaloniki':'greece.jpg','greece':'greece.jpg',
  'pointe-a-pitre':'guadaloupe.jpg','guadeloupe':'guadaloupe.jpg',
  'guatemala city':'guatemala.jpg','guatemala':'guatemala.jpg',
  'georgetown':'guyana-and-french-guyana.jpg','guyana':'guyana-and-french-guyana.jpg',
  'tegucigalda':'honduras.jpg','honduras':'honduras.jpg',
  'budapest':'hungary-budapest.jpg','hungary':'hungary-budapest.jpg',
  'reykjavik':'iceland.jpg','iceland':'iceland.jpg',
  'new delhi':'india.jpg','mumbai':'india.jpg','india':'india.jpg',
  'bali':'indonesia-bali.jpg','denpasar':'indonesia-bali.jpg',
  'jakarta':'indonesia-jakarta.jpg','indonesia':'indonesia.jpg',
  'tehran':'iran.jpg','iran':'iran.jpg',
  'baghdad':'iraq.jpg','iraq':'iraq.jpg',
  'dublin':'ireland.jpg','ireland':'ireland.jpg',
  'tel aviv':'israel-tel-aviv.jpg','jerusalem':'israel-tel-aviv.jpg','israel':'israel-tel-aviv.jpg',
  'milan':'italy-milan.jpg','rome':'italy.jpg','italy':'italy.jpg',
  'kingston':'jamaica.jpg','jamaica':'jamaica.jpg',
  'kyoto':'japan-kyoto.jpg','tokyo':'japan-tokyo.jpg','osaka':'japan-tokyo.jpg','japan':'japan-tokyo.jpg',
  'amman':'jordan.jpg','petra':'jordan-petra.jpg','jordan':'jordan.jpg',
  'nur-sultan':'kazakhstan.jpg','almaty':'kazakhstan.jpg','kazakhstan':'kazakhstan.jpg',
  'nairobi':'kenya.jpg','kenya':'kenya.jpg',
  'kuwait city':'kuwait.jpg','kuwait':'kuwait.jpg',
  'vientiane':'laos.jpg','luang prabang':'laos.jpg','laos':'laos.jpg',
  'riga':'latvia.jpg','latvia':'latvia.jpg',
  'maseru':'lesotho.jpg','lesotho':'lesotho.jpg',
  'vilnius':'lithuania.jpg','lithuania':'lithuania.jpg',
  'luxembourg city':'luxembourg.jpg','luxembourg':'luxembourg.jpg',
  'macau':'macau.jpg',
  'antananarivo':'madagascar.jpg','madagascar':'madagascar.jpg',
  'kuala lumpur':'malaysia-kuala-lumpur.jpg','penang':'malaysia-kuala-lumpur.jpg',
  'langkawi':'malaysia-kuala-lumpur.jpg','malaysia':'malaysia-kuala-lumpur.jpg',
  'male':'maledives.jpg','malé':'maledives.jpg','maldives':'maledives.jpg',
  'valletta':'malta.jpg','malta':'malta.jpg',
  'fort-de-france':'martinique.jpg','martinique':'martinique.jpg',
  'port louis':'mauritius.jpg','mauritius':'mauritius.jpg',
  'cabo san lucas':'mexico-baja.jpg','cancun':'mexico-cancun.jpg','cancún':'mexico-cancun.jpg',
  'mexico city':'mexico-city.jpg','tulum':'mexico-tulum.jpg','mexico':'mexico-city.jpg',
  'ulaanbaatar':'mongolia.jpg','mongolia':'mongolia.jpg',
  'podgorica':'monte-negro.jpg','montenegro':'monte-negro.jpg',
  'marrakech':'morocco.jpg','casablanca':'morocco.jpg','morocco':'morocco.jpg',
  'dakhla':'morocco.jpg','western sahara':'morocco.jpg',
  'windhoek':'namibia.jpg','namibia':'namibia.jpg',
  'kathmandu':'nepal.jpg','nepal':'nepal.jpg',
  'amsterdam':'netherlands.jpg','netherlands':'netherlands.jpg',
  'auckland':'new-zealand-auckland.jpg','wellington':'new-zealand-auckland.jpg','new zealand':'new-zealand-auckland.jpg',
  'managua':'nicaragua.jpg','nicaragua':'nicaragua.jpg',
  'lagos':'nigeria.jpg','abuja':'nigeria.jpg','nigeria':'nigeria.jpg',
  'skopje':'north-macedonia.jpg','north macedonia':'north-macedonia.jpg',
  'oslo':'norway.jpg','bergen':'norway-coast.jpg','norway':'norway.jpg',
  'muscat':'oman-muscat.jpg','oman':'oman-muscat.jpg',
  'karachi':'pakistan.jpg','islamabad':'pakistan.jpg','lahore':'pakistan.jpg','pakistan':'pakistan.jpg',
  'panama city':'panama-skyline.jpg','panama':'panama.jpg',
  'asuncion':'paraguay.jpg','paraguay':'paraguay.jpg',
  'lima':'peru-lima.jpg','peru':'peru.jpg','cusco':'peru.jpg',
  'manila':'philippines.jpg','cebu':'philippines.jpg','philippines':'philippines.jpg',
  'warsaw':'poland.jpg','krakow':'poland.jpg','poland':'poland.jpg',
  'lisbon':'portugal.jpg','porto':'portugal.jpg','portugal':'portugal.jpg',
  'san juan':'puerto-rico.jpg','puerto rico':'puerto-rico.jpg',
  'doha':'qatar-doha.jpg','qatar':'qatar-doha.jpg',
  'bucharest':'romania.jpg','romania':'romania.jpg',
  'san salvador':'salvador.jpg','el salvador':'salvador.jpg',
  'jeddah':'saudi-arabia-jeddah.jpg','riyadh':'saudi-arabia.jpg','saudi arabia':'saudi-arabia.jpg',
  'dakar':'senegal.jpg','senegal':'senegal.jpg',
  'mahe':'seychelles.jpg','seychelles':'seychelles.jpg',
  'singapore':'singapore.jpg',
  'bratislava':'slovakia.jpg','slovakia':'slovakia.jpg',
  'ljubljana':'slovenia.jpg','slovenia':'slovenia.jpg',
  'cape town':'south-africa-cape-town.jpg','johannesburg':'south-africa.jpg','south africa':'south-africa.jpg',
  'seoul':'south-korea.jpg','busan':'south-korea.jpg','south korea':'south-korea.jpg',
  'barcelona':'spain-barcelona.jpg','ibiza':'spain-ibiza.jpg','madrid':'spain-madrid.jpg',
  'majorca':'spain-majorca.jpg','mallorca':'spain-majorca.jpg',
  'malaga':'spain-malaga.jpg','málaga':'spain-malaga.jpg','spain':'spain-madrid.jpg',
  'colombo':'sri-lanka.jpg','sri lanka':'sri-lanka.jpg',
  'kingstown':'st-vincent.jpg','st vincent':'st-vincent.jpg','saint vincent':'st-vincent.jpg',
  'paramaribo':'suriname.jpg','suriname':'suriname.jpg',
  'stockholm':'sweden.jpg','gothenburg':'sweden.jpg','sweden':'sweden.jpg',
  'zurich':'switzerland.jpg','geneva':'switzerland.jpg','bern':'switzerland.jpg','switzerland':'switzerland.jpg',
  'taipei':'taiwan.jpg','taiwan':'taiwan.jpg',
  'dar es salaam':'tanzania-zanzibar.jpg','zanzibar':'zanzibar-tanzania.jpg','tanzania':'tanzania-zanzibar.jpg',
  'bangkok':'thailand-bangkok.jpg','phuket':'thailand-phuket.jpg','thailand':'thailand.jpg',
  'port of spain':'trinidad-tobago.jpg','trinidad':'trinidad-tobago.jpg','trinidad and tobago':'trinidad-tobago.jpg',
  'tunis':'morocco.jpg','tunisia':'morocco.jpg',
  'istanbul':'turkey-istanbul.jpg','ankara':'turkey.jpg','turkey':'turkey.jpg',
  'abu dhabi':'uae-abu-dhabi.jpg','dubai':'uae-dubai.jpg',
  'united arab emirates':'uae-dubai.jpg','uae':'uae-dubai.jpg',
  'kampala':'uganda.jpg','entebbe':'uganda.jpg','uganda':'uganda.jpg','rwanda':'uganda.jpg','kigali':'uganda.jpg',
  'london':'united-kingdom-london.jpg','edinburgh':'united-kingdom.jpg',
  'manchester':'united-kingdom.jpg','uk':'united-kingdom.jpg','united kingdom':'united-kingdom.jpg',
  'kyiv':'earth.jpg','ukraine':'earth.jpg',
  'montevideo':'uruguay-montevideo.jpg','uruguay':'uruguay-montevideo.jpg',
  'new york':'usa-new-york.jpg','chicago':'usa-chicago.jpg','los angeles':'usa-los-angeles.jpg',
  'miami':'usa-miami.jpg','houston':'usa-houston.jpg','dallas':'usa-dallas.jpg',
  'san francisco':'usa-san-francisco.jpg','washington':'washington-dc.jpg','washington dc':'washington-dc.jpg',
  'lihue':'usa-hawaii.jpg','kahului':'usa-hawaii.jpg','hawaii':'usa-hawaii.jpg',
  'st. thomas':'usa.jpg','us virgin islands':'usa.jpg','united states virgin islands':'usa.jpg',
  'fort lauderdale':'usa.jpg','philadelphia':'usa.jpg','usa':'usa.jpg','united states':'usa.jpg',
  'tashkent':'stan.jpg','uzbekistan':'stan.jpg','kyrgyzstan':'stan.jpg','bishkek':'stan.jpg','afghanistan':'stan.jpg','kabul':'stan.jpg','tajikistan':'stan.jpg','dushanbe':'stan.jpg',
  'caracas':'venezuela.jpg','venezuela':'venezuela.jpg',
  'hanoi':'vietnam.jpg','ho chi minh city':'vietnam.jpg','vietnam':'vietnam.jpg',
  'harare':'zimbabwe.jpg','zimbabwe':'zimbabwe.jpg',
  'calgary':'canada.jpg','montreal':'canada.jpg','hamilton':'bermuda.jpg',
  'hamburg':'germany.jpg','florence':'italy.jpg','venice':'italy.jpg',
  'goa':'india.jpg','lombok':'indonesia.jpg','machu picchu':'peru.jpg',
  'bogotá':'colombia-bogota.jpg','medellin':'colombia.jpg','medellín':'colombia.jpg',
  'da nang':'vietnam.jpg','ho chi minh':'vietnam.jpg','saigon':'vietnam.jpg',
  'durban':'south-africa.jpg','pretoria':'south-africa.jpg',
  'las vegas':'usa.jpg','seattle':'usa.jpg','boston':'usa.jpg','denver':'usa.jpg',
  'orlando':'usa.jpg','austin':'usa.jpg','charlotte':'usa.jpg','atlanta':'usa.jpg',
  'new york city':'usa-new-york.jpg','nyc':'usa-new-york.jpg','new york jfk':'usa-new-york.jpg',
  'miami':'usa-miami.jpg','los angeles':'usa-los-angeles.jpg',
  'melbourne, florida':'usa.jpg','melbourne, florida, usa':'usa.jpg',
  'reykjavík':'iceland.jpg','são paulo':'brazil-sao-paolo.jpg',
  'brasilia':'brazil.jpg','brasília':'brazil.jpg',
  'chiang mai':'thailand.jpg','pattaya':'thailand.jpg','perth':'australia.jpg',
  'boracay':'philippines.jpg','moscow':'russia.jpg','oslo':'norway.jpg',
  'mombasa':'kenya.jpg','colombo':'sri-lanka.jpg','chiang rai':'thailand.jpg'
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
          + ' loading="lazy" onerror="imgFallback(this)">'
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
          + '<img class="blog-card-img" src="' + (p.img || '') + '" alt="' + (p.cat || '').replace(/"/g, '&quot;') + '" loading=\"lazy\">'
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

function openBlogPost(slug, doPush) {
  const post = (window.BLOG_POSTS || []).find(p => p.slug === slug);
  if (!post) return;
  document.getElementById('blogpost-cat').textContent   = post.cat;
  document.getElementById('blogpost-title').textContent = post.title;
  document.getElementById('blogpost-meta').textContent  = post.date + ' · ' + post.readtime;
  document.getElementById('blogpost-body').innerHTML    = post.body;
  const heroImg  = document.getElementById('blogpost-hero-img');
  const heroWrap = document.getElementById('blogpost-hero-wrap');
  heroImg.src = 'images/earth.jpg';
  heroImg.alt = post.title;
  heroWrap.style.display = 'block';
  var excerptRaw = (post.body || '').match(/<p>([\s\S]*?)<\/p>/);
  var blogDesc = excerptRaw ? excerptRaw[1].replace(/<[^>]+>/g,'').trim().slice(0,155) : (post.title + ' — travel guide from FlyWell.Flights.');
  var postImg = post.heroImg || post.img || '';
  var postImgFull = postImg ? 'https://www.flywell.flights/' + postImg : 'https://www.flywell.flights/images/og-image.jpg';
  setMeta(post.title + ' | FlyWell.Flights Blog', blogDesc, postImgFull);
  // Article schema
  var oldSchema = document.getElementById('schema-article');
  if (oldSchema) oldSchema.remove();
  var articleSchema = document.createElement('script');
  articleSchema.type = 'application/ld+json';
  articleSchema.id = 'schema-article';
  var articleObj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: blogDesc,
    image: postImgFull,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'FlyWell.Flights' },
    publisher: {
      '@type': 'Organization',
      name: 'FlyWell.Flights',
      logo: { '@type': 'ImageObject', url: 'https://www.flywell.flights/images/og-image.jpg' }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.flywell.flights/blog/' + slug }
  };
  articleSchema.textContent = JSON.stringify(articleObj);
  document.head.appendChild(articleSchema);
  showPage('blogpost', doPush !== false, slug);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function openDeal(id, doPush) {
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
  var dealTitle = (d.title || ('Cheap flight from ' + (fromArr[0]||'') + ' to ' + (toArr[0]||'') + ' for only ' + d.price)) + ' | FlyWell.Flights';
  var dealDesc  = d.desc || ('Cheap flight from ' + (fromArr[0]||'') + ' to ' + (toArr[0]||'') + ' for only ' + d.price + ' ' + tripType + '. ' + (d.availability||'') + '. Book now via FlyWell.Flights.');
  var dealImg = resolveImage(toArr) || d.img || '';
  var dealImgFull = dealImg ? 'https://www.flywell.flights/' + dealImg : 'https://www.flywell.flights/images/og-image.jpg';
  setMeta(dealTitle, dealDesc.slice(0, 160), dealImgFull);
  // Deal schema
  var oldDealSchema = document.getElementById('schema-deal');
  if (oldDealSchema) oldDealSchema.remove();
  var dealSchema = document.createElement('script');
  dealSchema.type = 'application/ld+json';
  dealSchema.id = 'schema-deal';
  var priceNum = (d.price || '').replace(/[^0-9.]/g, '');
  var priceCurrency = (d.price || '').replace(/[0-9.,\s]/g,'').trim() || 'EUR';
  var dealObj = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.title || ('Flight from ' + (fromArr[0] || '') + ' to ' + (toArr[0] || '')),
    description: dealDesc.slice(0, 200),
    image: dealImgFull,
    offers: {
      '@type': 'Offer',
      url: 'https://www.flywell.flights/deals/' + d.id,
      priceCurrency: priceCurrency,
      price: priceNum,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'FlyWell.Flights' }
    }
  };
  dealSchema.textContent = JSON.stringify(dealObj);
  document.head.appendChild(dealSchema);
  showPage('deal', doPush !== false, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO — dynamic title + meta description
// ─────────────────────────────────────────────────────────────────────────────
function setMeta(title, description, imgUrl) {
  document.title = title;
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
  var ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);
  var ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);
  var canonical = 'https://www.flywell.flights' + window.location.pathname;
  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonical);
  var canonicalTag = document.getElementById('canonical-tag');
  if (canonicalTag) canonicalTag.setAttribute('href', canonical);
  var twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', title);
  var twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', description);
  if (imgUrl) {
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', imgUrl);
    var twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg) twImg.setAttribute('content', imgUrl);
  }
}

var META_DEFAULTS = {
  main:    { title: 'FlyWell.Flights — Cheap Flight Deals, Error Fares & Airline Sales', desc: 'FlyWell.Flights finds you the cheapest flights online. Browse daily cheap flight deals, error fares and airline sales from Europe and worldwide. Free, no signup required.' },
  blog:    { title: 'Travel Tips & Flight Guides — FlyWell.Flights Blog', desc: 'Expert travel guides, destination tips, and flight booking advice. Free from FlyWell.Flights.' },
  qa:      { title: 'FAQ — How to Find Cheap Flights | FlyWell.Flights', desc: 'Answers to your questions about finding cheap flights, error fares, and how FlyWell.Flights works.' },
  contact: { title: 'Contact Us — FlyWell.Flights', desc: 'Get in touch with the FlyWell.Flights team. Submit a deal tip, ask a question, or say hello.' },
  about:   { title: 'About FlyWell.Flights — Built by Travellers', desc: 'Learn about FlyWell.Flights — a free flight deals platform built by passionate travellers for travellers worldwide.' },
  terms:   { title: 'Terms of Service — FlyWell.Flights', desc: 'Terms of Service for FlyWell.Flights. Read our legal agreement governing use of the platform.' },
  privacy: { title: 'Privacy Policy — FlyWell.Flights', desc: 'Privacy Policy for FlyWell.Flights. How we collect, use, and protect your personal data under GDPR.' },
};


// URL scheme:
//   /              main (deals)
//   /blog          blog index
//   /blog/:slug    blog post
//   /deals/:id     deal detail
//   /qa  /contact  /about  /terms  /privacy
// ─────────────────────────────────────────────────────────────────────────────

function pageToPath(page, extra) {
  if (page === 'main')     return '/';
  if (page === 'blogpost') return '/blog/' + (extra || '');
  if (page === 'deal')     return '/deals/' + (extra || '');
  return '/' + page;
}

function pathToPage(path) {
  path = (path || '/').replace(/[/]+$/, '') || '/';
  if (path === '/')              return { page: 'main' };
  if (path === '/blog')          return { page: 'blog' };
  if (path.indexOf('/blog/') === 0)  return { page: 'blogpost', extra: path.slice(6) };
  if (path.indexOf('/deals/') === 0) return { page: 'deal',     extra: path.slice(7) };
  var simple = path.slice(1);
  if (['qa','contact','about','terms','privacy'].indexOf(simple) >= 0) return { page: simple };
  return { page: 'main' };
}

function showPage(page, doPush, extra) {
  ['main-page','contact-page','terms-page','privacy-page','about-page',
   'qa-page','deal-page','blog-page','blogpost-page'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === page + '-page') ? 'block' : 'none';
  });

  if (page === 'main') {
    const fromToEl = document.getElementById('search-from-to');
    if (fromToEl) fromToEl.value = '';
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
  var m = META_DEFAULTS[page];
  if (m) setMeta(m.title, m.desc);
  // Re-apply current language so every page renders in the correct language
  if (window.currentLang && window.currentLang !== 'en' && typeof window.setLang === 'function') {
    window.setLang(window.currentLang);
  }
  if (doPush !== false) {
    try {
      var path = pageToPath(page, extra);
      history.pushState({ page: page, extra: extra || null }, '', path);
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
  var pg, ex;
  if (e.state && e.state.page) {
    pg = e.state.page; ex = e.state.extra;
  } else {
    var r = pathToPage(window.location.pathname);
    pg = r.page; ex = r.extra;
  }
  if (pg === 'blogpost' && ex) openBlogPost(ex, false);
  else if (pg === 'deal' && ex) openDeal(Number(ex), false);
  else showPage(pg, false);
});

window.addEventListener('load', function() {
  if (!document.querySelector('#deals-grid .deal-card')) {
    renderDealsGrid();
  }
  renderBlogGrid();
  applyAllFilters();
  try {
    var r = pathToPage(window.location.pathname);
    var pg = r.page, ex = r.extra;
    if (pg === 'blogpost' && ex) openBlogPost(ex, false);
    else if (pg === 'deal' && ex) openDeal(Number(ex), false);
    else showPage(pg, false);
    history.replaceState({ page: pg, extra: ex || null }, '', window.location.pathname);
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

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EXPORTS — required because scripts load with defer
// ─────────────────────────────────────────────────────────────────────────────
window.showPage         = showPage;
window.openDeal         = openDeal;
window.openBlogPost     = openBlogPost;
window.blogPostBack     = blogPostBack;
window.filterByRegion   = filterByRegion;
window.runSearch        = runSearch;
window.loadMore         = loadMore;
window.toggleMonthPicker= toggleMonthPicker;
window.changeYear       = changeYear;
window.clearMonth       = clearMonth;
window.toggleQA         = toggleQA;
window.submitForm       = submitForm;
window.acceptCookies    = acceptCookies;
window.openCookiePrefs  = openCookiePrefs;
window.closeCookiePrefs = closeCookiePrefs;
window.updateToggle     = updateToggle;
window.savePrefs        = savePrefs;
window.navSearch        = navSearch;
window.navSearchGo      = navSearchGo;
window.setLang          = window.setLang || function(){};
