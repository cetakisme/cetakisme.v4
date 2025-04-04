import { type Table } from "@tanstack/react-table";

import * as XLSX from "xlsx";

export function useExportToExcel<TData>(
  table: Table<TData>,
  options?: {
    headers: string[];
    name: string;
  },
) {
  const download = () => {
    const rows = table
      .getRowModel()
      .rows.map((row) => row.getVisibleCells().map((cell) => cell.getValue()));

    const headers = options?.headers ?? [];

    const data = [headers, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, options?.name ?? "table-data.xlsx");

    // const range = XLSX.utils.decode_range(worksheet["!ref"]!);
    // range.s.r++; // Increment start row
    // worksheet["!ref"] = XLSX.utils.encode_range(range);

    // // Delete each cell in the first row
    // for (let C = range.s.c; C <= range.e.c; ++C) {
    //   const cellAddress = XLSX.utils.encode_cell({ c: C, r: range.s.r - 1 });
    //   delete worksheet[cellAddress];
    // }

    // const workbook = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    // XLSX.writeFile(workbook, options?.name ?? "table-data.xlsx");
  };

  return download;
}
