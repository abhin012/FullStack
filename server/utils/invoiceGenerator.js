import PDFDocument from "pdfkit";

export const generateInvoicePDF = (paymentRecord, userDoc) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Invoice", { align: "right" });
    doc.moveDown();

    doc.fontSize(10).fillColor("#666").text("Invoice Number:", 50, doc.y, { continued: true });
    doc.fillColor("#000").text(`  ${paymentRecord.invoiceNumber}`);
    doc.fillColor("#666").text("Date:", 50, doc.y, { continued: true });
    doc.fillColor("#000").text(`  ${new Date(paymentRecord.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(12).fillColor("#000").text("Billed To:", { underline: true });
    doc.fontSize(10).text(paymentRecord.billingName || userDoc.name);
    doc.text(paymentRecord.billingEmail || userDoc.email);
    doc.moveDown();

    doc.fontSize(12).text("Subscription Details:", { underline: true });
    doc.fontSize(10).text(`Plan: ${paymentRecord.plan.toUpperCase()}`);
    doc.text(`Billing Period: ${new Date(paymentRecord.subscriptionStart).toLocaleDateString()} – ${new Date(paymentRecord.subscriptionEnd).toLocaleDateString()}`);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Amount Paid:`, 50, doc.y, { continued: true });
    doc.fontSize(14).text(`  ₹${paymentRecord.amount}`, { align: "left" });
    doc.moveDown();

    doc.fontSize(9).fillColor("#999").text(`Payment ID: ${paymentRecord.razorpayPaymentId}`);
    doc.text(`Order ID: ${paymentRecord.razorpayOrderId}`);

    doc.end();
  });
};