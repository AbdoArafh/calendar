import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportNodeToPDF(
  node: HTMLElement,
  fileName = "export.pdf"
) {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName);
}
