import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SystemSettings } from '../types';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (
  data: any[], 
  columns: { header: string; dataKey: string }[], 
  title: string, 
  settings: SystemSettings
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(30, 75, 122); // Lufussa Blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo Placeholder or Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName, 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE GESTIÓN LOGÍSTICA', 20, 32);

  // Report Info
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(18);
  doc.text(title, 20, 55);
  
  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 20, 62);

  // Table
  doc.autoTable({
    startY: 70,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    theme: 'striped',
    headStyles: { fillColor: [30, 75, 122], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 70 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - ${settings.companyName} Confidencial`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};
