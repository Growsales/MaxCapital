/**
 * Utility to export data as CSV file download
 */
export function exportToCSV(data: Record<string, any>[], filename: string, headers?: Record<string, string>) {
  if (!data.length) return;

  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const headerRow = headers ? Object.values(headers) : keys;

  const csvRows = [
    headerRow.join(';'),
    ...data.map(row =>
      keys.map(key => {
        const val = row[key];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(';')
    ),
  ];

  const csvString = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
