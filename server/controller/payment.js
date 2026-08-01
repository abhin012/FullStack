import crypto from "crypto";
import razorpayInstance from "../config/razorpay.js";
import payment from "../models/payment.js";
import user from "../models/auth.js";
import { getPlan } from "../config/plans.js";
import { sendPaymentConfirmationEmail } from "../utils/mailer.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";

export const createOrder = async (req, res) => {
  const { planKey } = req.body;
  const plan = getPlan(planKey);

  if (!plan || plan.key === "free") {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const amountInPaise = plan.priceInRupees * 100;

    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const paymentRecord = await payment.create({
      user: req.userid,
      plan: plan.key,
      amount: plan.priceInRupees,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.status(200).json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentRecordId: paymentRecord._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

const generateInvoiceNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randomPart}`;
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    paymentRecordId,
    billingName,
    billingEmail,
  } = req.body;

  try {
    const paymentRecord = await payment.findById(paymentRecordId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "payment record not found" });
    }
    if (String(paymentRecord.user) !== String(req.userid)) {
      return res.status(403).json({ message: "not authorized" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      paymentRecord.status = "failed";
      await paymentRecord.save();
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const plan = getPlan(paymentRecord.plan);
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    paymentRecord.status = "paid";
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.invoiceNumber = generateInvoiceNumber();
    paymentRecord.billingName = billingName;
    paymentRecord.billingEmail = billingEmail;
    paymentRecord.subscriptionStart = subscriptionStart;
    paymentRecord.subscriptionEnd = subscriptionEnd;
    await paymentRecord.save();

    const currentUser = await user.findById(req.userid);
    currentUser.plan = plan.key;
    currentUser.planExpiry = subscriptionEnd;
    await currentUser.save();

    // Fire-and-forget: don't make the user wait on email delivery to see success.
    generateInvoicePDF(paymentRecord, currentUser)
      .then((pdfBuffer) =>
        sendPaymentConfirmationEmail({
          to: currentUser.email,
          name: currentUser.name,
          plan: plan.key,
          amount: paymentRecord.amount,
          invoiceNumber: paymentRecord.invoiceNumber,
          invoicePdfBuffer: pdfBuffer,
        })
      )
      .catch((err) => console.log("Invoice/email error:", err.message));

    res.status(200).json({
      message: "Payment verified, plan activated",
      plan: plan.key,
      planExpiry: subscriptionEnd,
      invoiceNumber: paymentRecord.invoiceNumber,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const history = await payment
      .find({ user: req.userid, status: "paid" })
      .sort({ createdAt: -1 });
    res.status(200).json({ data: history });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const downloadInvoice = async (req, res) => {
  const { paymentId } = req.params;
  try {
    const paymentRecord = await payment.findById(paymentId);
    if (!paymentRecord || String(paymentRecord.user) !== String(req.userid)) {
      return res.status(404).json({ message: "invoice not found" });
    }
    if (paymentRecord.status !== "paid") {
      return res.status(400).json({ message: "invoice not available for this payment" });
    }

    const currentUser = await user.findById(req.userid);
    const pdfBuffer = await generateInvoicePDF(paymentRecord, currentUser);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${paymentRecord.invoiceNumber}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};