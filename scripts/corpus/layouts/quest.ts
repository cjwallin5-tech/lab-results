import type { Scenario, ScenarioRow } from '../scenarios';
import { formatRawRange } from '../format';

/**
 * Renders a scenario as a Quest-style report HTML page. Mirrors the real Quest
 * layout: three stacked info blocks up top, then a monospace results table with
 * columns Test Name | Result | Flag | Reference Range | Lab — where the unit is
 * GLUED into the reference-range cell, the flag is a colored NORMAL/HIGH/LOW
 * word, range dashes are unspaced, and free-text footnotes interleave between
 * result rows. Synthetic data only (FR-15).
 */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The colored word Quest prints in its Flag column. Normal rows show NORMAL. */
function flagCell(row: ScenarioRow): string {
  const word = row.flags.length > 0 ? row.flags[0] : 'NORMAL';
  const cls =
    word.toUpperCase() === 'HIGH'
      ? 'flag-high'
      : word.toUpperCase() === 'LOW'
        ? 'flag-low'
        : 'flag-normal';
  return `<span class="${cls}">${esc(word)}</span>`;
}

function rangeCell(scenario: Scenario, row: ScenarioRow): string {
  const range = formatRawRange(scenario.layout, row.range);
  return esc([range, row.unit].filter((part) => part !== undefined && part !== '').join(' '));
}

export function renderQuestHtml(scenario: Scenario): string {
  const bodyRows = scenario.sections
    .map((section) => {
      const header = `<tr class="section"><td colspan="5">${esc(section.title)}</td></tr>`;
      const rows = section.rows
        .map((row) => {
          const main = `<tr class="result">
            <td class="name">${esc(row.name)}</td>
            <td class="result-val">${esc(row.value)}</td>
            <td class="flag">${flagCell(row)}</td>
            <td class="range">${rangeCell(scenario, row)}</td>
            <td class="lab">01</td>
          </tr>`;
          const footnote =
            row.footnote !== undefined
              ? `<tr class="footnote"><td colspan="5">${esc(row.footnote)}</td></tr>`
              : '';
          return main + footnote;
        })
        .join('\n');
      return header + '\n' + rows;
    })
    .join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: Letter; margin: 0.6in 0.7in; }
  * { box-sizing: border-box; }
  body {
    font-family: "Courier New", ui-monospace, monospace;
    font-size: 10.5px;
    color: #111;
    line-height: 1.35;
  }
  .brand { font-family: Arial, Helvetica, sans-serif; font-size: 13px; letter-spacing: 0.5px; }
  .header { display: flex; justify-content: space-between; gap: 24px; margin-top: 6px; }
  .header .col { width: 33%; }
  .label { font-size: 9px; letter-spacing: 0.5px; color: #333; }
  .strong { font-weight: bold; }
  .stamps { margin-top: 10px; font-size: 9.5px; color: #333; }
  hr { border: none; border-top: 1px solid #000; margin: 14px 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  thead td { font-weight: bold; border-bottom: 1px solid #000; padding: 4px 6px; font-size: 10px; }
  td { padding: 2px 6px; vertical-align: top; }
  tr.section td { font-weight: bold; padding-top: 10px; }
  tr.result .result-val, tr.result .lab { white-space: nowrap; }
  td.lab { text-align: right; color: #333; }
  tr.footnote td { color: #333; padding-left: 18px; padding-bottom: 4px; white-space: normal; }
  .flag-high { color: #b00020; font-weight: bold; }
  .flag-low { color: #0b57d0; font-weight: bold; }
  .flag-normal { color: #333; }
</style>
</head>
<body>
  <div class="brand">Quest Diagnostics</div>
  <div class="header">
    <div class="col">
      <div class="label">SPECIMEN INFORMATION</div>
      <div>SPECIMEN: SY00000001</div>
      <div>REQUISITION: 0001</div>
      <div>LAB REF NO: 000001</div>
    </div>
    <div class="col">
      <div class="label">PATIENT INFORMATION</div>
      <div class="strong">${esc(scenario.patient.name)}</div>
      <div>DOB: ${esc(scenario.patient.dob)}</div>
      <div>GENDER: ${esc(scenario.patient.gender)}</div>
    </div>
    <div class="col">
      <div class="label">REPORT STATUS: FINAL</div>
      <div class="label" style="margin-top:6px;">ORDERING PHYSICIAN</div>
      <div class="strong">${esc(scenario.physician)}</div>
      <div class="label" style="margin-top:6px;">CLIENT INFORMATION</div>
      <div>Synthetic Demo Labs</div>
    </div>
  </div>
  <div class="stamps">
    COLLECTED: ${esc(scenario.collected)}<br />
    RECEIVED: ${esc(scenario.collected)}<br />
    REPORTED: ${esc(scenario.reported)}
  </div>
  <hr />
  <table>
    <thead>
      <tr>
        <td>Test Name</td>
        <td>Result</td>
        <td>Flag</td>
        <td>Reference Range</td>
        <td style="text-align:right;">Lab</td>
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>
</body>
</html>`;
}
