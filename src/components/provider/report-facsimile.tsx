import type { ResultRow } from "@/lib/model/types";

/**
 * A stand-in for the report PDF on the verify screen: the raw transcribed lines
 * rendered as a printed report, so the provider can check what was read. No real
 * PDF exists in synthetic mode.
 */
export function ReportFacsimile({ rows, patientName }: { rows: ResultRow[]; patientName: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 font-mono text-xs text-ink/80 shadow-sm">
      <p className="text-sm font-semibold">Laboratory report</p>
      <p className="mt-1 text-muted">Patient: {patientName}</p>
      <hr className="my-3 border-line" />
      <table className="w-full">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2 font-normal">Test</th>
            <th className="pb-2 font-normal">Result</th>
            <th className="pb-2 font-normal">Reference</th>
            <th className="pb-2 font-normal">Flag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.rawName}-${index}`} className="border-t border-line/60">
              <td className="py-1.5">{row.rawName}</td>
              <td className="py-1.5">
                {row.value} {row.unit}
              </td>
              <td className="py-1.5">
                {row.rawRange ?? ([row.refLow, row.refHigh].filter(Boolean).join(" - ") || "-")}
              </td>
              <td className="py-1.5">{row.labFlags.join(" ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
