import type { Scenario, ScenarioRow } from '../scenarios';
import { formatRawRange } from '../format';

/**
 * Renders a scenario as a LabCorp-style report HTML page. Mirrors the real
 * LabCorp patient report: a teal banner, a three-column Patient / Specimen /
 * Physician detail band, an "Ordered Items" line, then a monospace results table
 * with columns TESTS | RESULT | FLAG | UNITS | REFERENCE INTERVAL | LAB — where
 * the unit has its OWN column, the flag is blank when normal (bold High/Low
 * otherwise), and range dashes are spaced. Synthetic data only (FR-15).
 */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function flagCell(row: ScenarioRow): string {
  if (row.flags.length === 0) return '';
  const word = row.flags[0];
  const cls = word.toLowerCase() === 'low' ? 'flag-low' : 'flag-high';
  return `<span class="${cls}">${esc(word)}</span>`;
}

export function renderLabcorpHtml(scenario: Scenario): string {
  const orderedItems = scenario.sections.map((section) => section.title).join('; ');

  const bodyRows = scenario.sections
    .map((section) => {
      const header = `<tr class="section"><td colspan="6">${esc(section.title)}</td></tr>`;
      const rows = section.rows
        .map((row) => {
          const range = formatRawRange(scenario.layout, row.range) ?? 'Not Estab.';
          return `<tr class="result">
            <td class="name">${esc(row.name)}</td>
            <td class="result-val">${esc(row.value)}</td>
            <td class="flag">${flagCell(row)}</td>
            <td class="unit">${esc(row.unit ?? '')}</td>
            <td class="range">${esc(range)}</td>
            <td class="lab">01</td>
          </tr>`;
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
  @page { size: Letter; margin: 0.5in 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: "Courier New", ui-monospace, monospace; font-size: 10.5px; color: #111; line-height: 1.35; }
  .banner {
    background: #007398; color: #fff; padding: 8px 12px;
    display: flex; justify-content: space-between; align-items: center;
    font-family: Arial, Helvetica, sans-serif;
  }
  .banner .logo { font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }
  .banner .title { font-size: 13px; }
  .specimen { padding: 6px 2px; font-size: 9.5px; border-bottom: 3px solid #007398; }
  .details { display: flex; gap: 20px; margin-top: 10px; }
  .details .col { width: 33%; }
  .details .head { color: #007398; font-weight: bold; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
  .details .k { font-weight: bold; }
  .ordered { margin-top: 12px; font-size: 9.5px; }
  .ordered .head { color: #007398; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  thead td { font-weight: bold; border-bottom: 1px solid #000; padding: 4px 6px; font-size: 10px; text-align: center; }
  thead td.name-h { text-align: left; }
  td { padding: 2px 6px; vertical-align: top; }
  td.result-val, td.flag, td.unit, td.range, td.lab { text-align: center; white-space: nowrap; }
  tr.section td { font-weight: bold; padding-top: 10px; text-align: left; }
  .flag-high { color: #b00020; font-weight: bold; }
  .flag-low { color: #0b57d0; font-weight: bold; }
  .footer { margin-top: 18px; border-top: 1px solid #999; padding-top: 4px; font-size: 8.5px; color: #444; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="banner">
    <div class="logo">LabCorp</div>
    <div class="title">Patient Report</div>
  </div>
  <div class="specimen">
    <span class="k" style="font-weight:bold;">Specimen ID:</span> 000-000-0000-0 &nbsp;
    <span style="font-weight:bold;">Control ID:</span> C0000000001
  </div>
  <div class="details">
    <div class="col">
      <div class="head">Patient Details</div>
      <div><span class="k">Name:</span> ${esc(scenario.patient.name)}</div>
      <div><span class="k">DOB:</span> ${esc(scenario.patient.dob)}</div>
      <div><span class="k">Gender:</span> ${esc(scenario.patient.gender)}</div>
    </div>
    <div class="col">
      <div class="head">Specimen Details</div>
      <div><span class="k">Date collected:</span> ${esc(scenario.collected)}</div>
      <div><span class="k">Date reported:</span> ${esc(scenario.reported)}</div>
    </div>
    <div class="col">
      <div class="head">Physician Details</div>
      <div><span class="k">Ordering:</span> ${esc(scenario.physician)}</div>
    </div>
  </div>
  <div class="ordered">
    <span class="head">Ordered Items</span><br />
    ${esc(orderedItems)}
  </div>
  <table>
    <thead>
      <tr>
        <td class="name-h">TESTS</td>
        <td>RESULT</td>
        <td>FLAG</td>
        <td>UNITS</td>
        <td>REFERENCE INTERVAL</td>
        <td>LAB</td>
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>
  <div class="footer">
    <span>This document contains private and confidential health information.</span>
    <span>FINAL REPORT &nbsp; Page 1 of 1</span>
  </div>
</body>
</html>`;
}
