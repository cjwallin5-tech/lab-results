/* ─── Build reverse alias lookup ─── */
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALIAS_MAP = {};
for (const [key, info] of Object.entries(LAB_DICT)) {
  for (const alias of info.aliases) {
    ALIAS_MAP[norm(alias)] = key;
  }
}

function lookupTest(rawName) {
  const n = norm(rawName);
  if (ALIAS_MAP[n]) return LAB_DICT[ALIAS_MAP[n]];
  // Try prefix / substring matching for longer strings
  for (const [alias, key] of Object.entries(ALIAS_MAP)) {
    if (alias.length > 3 && n.length > 3 && (alias.startsWith(n) || n.startsWith(alias))) {
      return LAB_DICT[key];
    }
  }
  return null;
}

/* ─── Parser ─── */
function parseLine(raw) {
  let line = raw.trim();
  if (!line) return null;

  // Skip obvious section headers and separator lines
  if (/^[-=_*]{3,}$/.test(line)) return null;
  if (/^(test|result|reference|range|units|flag|normal|analyte|component|value|low|high|name)\b/i.test(line) &&
      !/\d/.test(line)) return null;

  // Strip common flags/annotations that clutter parsing
  line = line.replace(/\b(normal|abnormal|critical|see note|flags?|performed at|collected|ordered)\b.*/i, '');
  line = line.replace(/\bH\b|\bL\b|\bA\b/g, ' '); // single-letter flags
  line = line.replace(/[*†‡]+/g, ' ');

  // Extract reference range — look for bracket/paren pattern first
  let refLow = null, refHigh = null;
  const bracketRange = line.match(/[\(\[<{](\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)[\)\]>}]/);
  if (bracketRange) {
    refLow = parseFloat(bracketRange[1]);
    refHigh = parseFloat(bracketRange[2]);
    line = line.replace(bracketRange[0], ' ');
  } else {
    // Look for a bare range pattern (not followed by more digits — avoids matching values)
    const bareRange = line.match(/(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)(?!\s*[-–—]\s*\d)/);
    if (bareRange) {
      const allNums = (line.match(/\d+\.?\d*/g) || []).length;
      if (allNums >= 3) { // need at least name + value + range
        refLow = parseFloat(bareRange[1]);
        refHigh = parseFloat(bareRange[2]);
        line = line.replace(bareRange[0], ' ');
      }
    }
  }

  // Extract unit
  const unitMatch = line.match(/\b(mg\/dL|mmol\/L|g\/dL|K\/uL|K\/µL|M\/uL|M\/µL|mEq\/L|IU\/L|U\/L|nmol\/L|pmol\/L|µIU\/mL|mIU\/mL|mIU\/L|ng\/mL|ng\/dL|pg\/mL|µg\/dL|fL|pg|mL\/min(?:\/[\d.]+m²)?|sec(?:onds?)?|mm\/hr|mg\/L|g\/L)\b/i);
  const unit = unitMatch ? unitMatch[1] : (line.match(/\b%\b/) ? '%' : null);
  if (unit) line = line.replace(unit, ' ');

  // Extract numeric value — first standalone number left in line
  const valMatch = line.match(/(?:^|[:\s|])(\d+\.?\d*)(?:\s|$|[,|])/);
  if (!valMatch) return null;
  const value = parseFloat(valMatch[1]);
  if (isNaN(value)) return null;

  // Test name: everything before the first digit sequence
  const beforeFirstNum = line.match(/^([^0-9]+)/);
  if (!beforeFirstNum) return null;
  let testName = beforeFirstNum[1].replace(/[:\-=|\.\/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (testName.length < 2 || testName.length > 70) return null;

  return { testName, value, unit, refLow, refHigh };
}

function determineStatus(value, refLow, refHigh) {
  if (refLow === null || refHigh === null) return 'unknown';
  if (value < refLow) return 'low';
  if (value > refHigh) return 'high';
  return 'in-range';
}

function computeBarPositions(value, refLow, refHigh) {
  const span = refHigh - refLow;
  const pad = span * 0.35;
  const vizMin = Math.max(0, refLow - pad);
  const vizMax = refHigh + pad;
  const vizSpan = vizMax - vizMin;
  if (vizSpan === 0) return null;

  const refFillLeft = ((refLow - vizMin) / vizSpan) * 100;
  const refFillWidth = (span / vizSpan) * 100;
  const markerPct = ((value - vizMin) / vizSpan) * 100;
  const markerPos = Math.max(2, Math.min(98, markerPct));

  return { refFillLeft, refFillWidth, markerPos, vizMin, vizMax };
}

function formatNum(n) {
  if (n === null || n === undefined) return '';
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(3)));
}

/* ─── Renderer ─── */
function renderCard(parsed, info) {
  const status = determineStatus(parsed.value, parsed.refLow, parsed.refHigh);
  const displayName = info ? info.displayName : parsed.testName;
  const showRawName = info && norm(info.displayName) !== norm(parsed.testName);

  const statusLabel = {
    'in-range': 'Within Range',
    'high': 'Above Range',
    'low': 'Below Range',
    'unknown': 'Range Not Found',
  }[status];

  const valueDisplay = formatNum(parsed.value) + (parsed.unit ? ' ' + parsed.unit : '');
  const rangeDisplay = (parsed.refLow !== null && parsed.refHigh !== null)
    ? formatNum(parsed.refLow) + '–' + formatNum(parsed.refHigh) + (parsed.unit ? ' ' + parsed.unit : '')
    : null;

  let barHTML = '';
  if (parsed.refLow !== null && parsed.refHigh !== null) {
    const bar = computeBarPositions(parsed.value, parsed.refLow, parsed.refHigh);
    if (bar) {
      barHTML = `
        <div class="range-bar-wrap">
          <div class="range-bar-track">
            <div class="range-bar-fill" style="left:${bar.refFillLeft.toFixed(1)}%;width:${bar.refFillWidth.toFixed(1)}%"></div>
            <div class="range-bar-marker status-${status}" style="left:${bar.markerPos.toFixed(1)}%" aria-hidden="true"></div>
          </div>
          <div class="range-bar-ends">
            <span>${formatNum(bar.vizMin)}</span>
            <span>↑ your result: ${formatNum(parsed.value)}</span>
            <span>${formatNum(bar.vizMax)}</span>
          </div>
        </div>`;
    }
  }

  const categoryBadge = info ? `<span class="category-badge">${info.category}</span>` : '';
  const explainHTML = info
    ? `<p class="result-explain">${info.explain}</p>`
    : `<p class="no-explain-note">We don't have a plain-English explanation for this test yet. Your values and reference range are shown as they appear in your results.</p>`;

  return `
    <div class="result-card status-${status}">
      ${categoryBadge}
      <div class="card-top">
        <span class="result-name">${escHtml(displayName)}${showRawName ? `<span class="result-raw-name">(${escHtml(parsed.testName)})</span>` : ''}</span>
        <span class="status-chip status-${status}">${statusLabel}</span>
      </div>
      ${explainHTML}
      <div class="result-data">
        <div class="data-item">
          <span class="data-label">Your result</span>
          <span class="data-value">${escHtml(valueDisplay)}</span>
        </div>
        ${rangeDisplay ? `<div class="data-item">
          <span class="data-label">Reference range</span>
          <span class="data-value">${escHtml(rangeDisplay)}</span>
        </div>` : ''}
      </div>
      ${barHTML}
    </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── Main translate function ─── */
function translate() {
  const raw = document.getElementById('labInput').value;
  const errorEl = document.getElementById('parseError');
  errorEl.style.display = 'none';

  if (!raw.trim()) {
    errorEl.textContent = 'Please paste your lab results into the text area above.';
    errorEl.style.display = 'block';
    return;
  }

  const lines = raw.split(/\r?\n/);
  const cards = [];
  const unparsed = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) {
      const t = line.trim();
      if (t && t.length > 2 && /[a-zA-Z]/.test(t)) {
        unparsed.push(t);
      }
      continue;
    }
    const info = lookupTest(parsed.testName);
    cards.push({ parsed, info });
  }

  if (cards.length === 0) {
    errorEl.textContent = 'We couldn\'t read any results from that text. Try copying directly from your lab report PDF or patient portal — each result should be on its own line with the value and reference range.';
    errorEl.style.display = 'block';
    return;
  }

  // Render
  const listEl = document.getElementById('resultsList');
  listEl.innerHTML = cards.map(c => renderCard(c.parsed, c.info)).join('');

  document.getElementById('resultsMeta').textContent =
    `${cards.length} result${cards.length === 1 ? '' : 's'} found`;

  const unparsedSection = document.getElementById('unparsedSection');
  const unparsedList = document.getElementById('unparsedList');
  if (unparsed.length > 0) {
    unparsedList.innerHTML = unparsed.map(u => `<li class="unparsed-item">${escHtml(u)}</li>`).join('');
    unparsedSection.style.display = 'block';
  } else {
    unparsedSection.style.display = 'none';
  }

  document.getElementById('resultsPanel').style.display = 'block';
  document.getElementById('clearBtn').style.display = 'inline-flex';

  setTimeout(() => {
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

/* ─── Example data ─── */
function loadExample() {
  const example = `COMPLETE BLOOD COUNT (CBC)
WBC               7.2      K/uL     4.0-11.0
RBC               4.85     M/uL     4.20-5.80
Hemoglobin        14.2     g/dL     13.5-17.5
Hematocrit        42.1     %        41.0-53.0
MCV               86.8     fL       80.0-100.0
MCH               29.3     pg       27.0-33.0
MCHC              33.7     g/dL     32.0-36.0
RDW               13.1     %        11.5-14.5
Platelets         245      K/uL     150-400
Neutrophils       58.2     %        45.0-75.0
Lymphocytes       32.1     %        18.0-44.0

COMPREHENSIVE METABOLIC PANEL
Glucose           92       mg/dL    70-99
BUN               14       mg/dL    7-20
Creatinine        0.9      mg/dL    0.7-1.3
Sodium            139      mEq/L    136-145
Potassium         4.1      mEq/L    3.5-5.1
Chloride          101      mEq/L    98-107
CO2               24       mEq/L    22-29
Calcium           9.4      mg/dL    8.5-10.5
Total Protein     7.2      g/dL     6.0-8.0
Albumin           4.3      g/dL     3.5-5.0
Total Bilirubin   0.8      mg/dL    0.2-1.2
ALT               22       U/L      7-45
AST               19       U/L      10-40
ALP               67       U/L      44-147

LIPID PANEL
Total Cholesterol 212      mg/dL    125-200
LDL Cholesterol   138      mg/dL    0-99
HDL Cholesterol   52       mg/dL    40-60
Triglycerides     88       mg/dL    0-150

THYROID
TSH               2.1      mIU/L    0.4-4.0

OTHER
Hemoglobin A1c    5.7      %        4.8-5.6
Vitamin D         38       ng/mL    30-100
Ferritin          62       ng/mL    12-300`;

  document.getElementById('labInput').value = example;
  translate();
}

/* ─── Clear ─── */
function clearAll() {
  document.getElementById('labInput').value = '';
  document.getElementById('resultsPanel').style.display = 'none';
  document.getElementById('parseError').style.display = 'none';
  document.getElementById('clearBtn').style.display = 'none';
  document.getElementById('labInput').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Keyboard shortcut: Cmd/Ctrl+Enter to translate ─── */
document.getElementById('labInput').addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    translate();
  }
});
