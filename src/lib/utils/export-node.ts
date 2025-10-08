import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportNodeToPDF(
  node: HTMLElement,
  fileName = "export.pdf"
) {
  const pdf = await createCalendarPDF([node]);

  pdf.save(fileName);
}

export async function exportNodesToPDF(
  nodes: HTMLElement[],
  fileName = "export.pdf"
) {
  const pdf = await createCalendarPDF(nodes);

  pdf.save(fileName);
}

export async function createCalendarPDF(nodes: HTMLElement[]) {
  if (nodes.length === 0) throw new Error("No calendar nodes provided.");

  const canvases = await Promise.all(
    nodes.map((node) => html2canvas(node, { scale: 2, useCORS: true }))
  );

  const firstCanvas = canvases[0];
  const pdf = new jsPDF({
    orientation:
      firstCanvas.width > firstCanvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [firstCanvas.width, firstCanvas.height],
  });

  pdf.addImage(
    firstCanvas.toDataURL("image/jpeg", 0.9),
    "jpeg",
    0,
    0,
    firstCanvas.width,
    firstCanvas.height
  );

  for (let i = 1; i < canvases.length; i++) {
    const canvas = canvases[i];

    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    const orientation = canvas.width > canvas.height ? "landscape" : "portrait";

    pdf.addPage([canvas.width, canvas.height], orientation);
    pdf.addImage(imgData, "jpeg", 0, 0, canvas.width, canvas.height);
  }

  return pdf;
}
