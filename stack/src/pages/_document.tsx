import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <Main />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <NextScript />
      </body>
    </Html>
  );
}
