// lib/client/exportPDF.ts — client-only; never import from server/RSC
export async function exportPDF(title: string, body: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();

  pdf.text(title, 10, 10);
  pdf.text(body, 10, 20);

  pdf.save(`${title}.pdf`);
}
