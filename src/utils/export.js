// utils/export.js
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./format";
import logo from "../assets/images/logo_euroelec.png";

// Export Excel
export const exportRangeToExcel = (startDate, endDate, temps) => {
  const cleanStartDate = startDate.replace(/\//g, "-");
  const cleanEndDate = endDate.replace(/\//g, "-");
  const sheetName = `Températures ${cleanStartDate}_${cleanEndDate}`.substring(0, 31);

  temps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const worksheet = utils.json_to_sheet(
    temps.map((temp) => ({
      Date: formatDate(temp.timestamp, { day: "2-digit", month: "2-digit", year: "numeric" }),
      Heure: formatDate(temp.timestamp, { hour: "2-digit", minute: "2-digit" }),
      Sonde: temp.sensor_name,
      Temperature: (temp.value / 10).toFixed(1),
    }))
  );

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);
  writeFile(workbook, `temperatures_${cleanStartDate}_${cleanEndDate}.xlsx`);
};

// Export PDF
export const exportRangeToPdf = (startDate, endDate, temps) => {
  const doc = new jsPDF();
  const imgData = logo;

  temps.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const tableColumn = ["Date", "Heure", "Sonde", "Température (°C)"];
  const tableRows = temps.map((temp) => [
    formatDate(temp.timestamp, { day: "2-digit", month: "2-digit", year: "numeric" }),
    formatDate(temp.timestamp, { hour: "2-digit", minute: "2-digit" }),
    temp.sensor_name,
    (temp.value / 10).toFixed(1),
  ]);

  const headerHeight = 40;
  const drawHeader = () => {
    doc.setFontSize(18);
    doc.setTextColor("#333");
    doc.text(`Températures du ${startDate} au ${endDate}`, 14, 22);
    if (imgData) doc.addImage(imgData, "PNG", 150, 10, 40, 20);
  };

  autoTable(doc, {
    margin: { top: 45 },
    startY: headerHeight,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: "#306e4d" },
    didDrawPage: () => drawHeader(),
  });

  doc.save(`temperatures_${startDate.replace(/\//g, "-")}_${endDate.replace(/\//g, "-")}.pdf`);
};
