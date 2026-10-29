"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  width?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  onRowClick,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead className="bg-white/[0.04] text-[9px] uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-2 font-bold ${column.className || ""}`} style={column.width ? { width: column.width } : undefined}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center">
                  <Loader2 size={18} className="mx-auto animate-spin text-indigo-400" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-xs text-slate-500">
                  {empty || "暂无数据"}
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`text-[11px] text-slate-300 ${onRowClick ? "cursor-pointer hover:bg-white/[0.035]" : ""}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2.5 align-middle ${column.className || ""}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
