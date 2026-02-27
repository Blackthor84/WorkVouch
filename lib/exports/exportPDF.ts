export async function exportPDF(title: string, body: string) {
  const jsPDF = (await import("jspdf")).default;
  const pdf = new jsPDF();
  pdf.text(title, 10, 10);
  pdf.text(body, 10, 20);
  pdf.save("trust-simulation-report.pdf");
}
