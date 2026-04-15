export function Terms() {
  return (
    <div className="legal-page">
      <h1>Terms and Conditions</h1>
      <p>Last updated: April 2026</p>

      <h2>1. Platform Overview</h2>
      <p>
        SEIRA is a manufacturing marketplace that connects customers seeking standard or custom
        industrial products with verified manufacturing companies ("Vendors"). By using SEIRA,
        you agree to be bound by these Terms and Conditions.
      </p>

      <h2>2. Account Registration</h2>
      <p>
        You must register an account to place or fulfill orders. You are responsible for maintaining
        the security of your account credentials. SEIRA reserves the right to suspend any account
        found to be in violation of these terms.
      </p>

      <h2>3. Orders and Negotiation</h2>
      <p>
        Customers may place standard product orders with immediate payment, or submit custom
        manufacturing requests with proposed rates and delivery dates. Vendors may accept, negotiate,
        or reject custom orders. Acceptance of an order (by either party) creates a binding contract
        between the customer and vendor — SEIRA is not a party to this contract.
      </p>

      <h2>4. Payments</h2>
      <p>
        All payments are processed through Razorpay. Standard product payments are processed
        immediately. For custom orders, payment is initiated after both parties agree on the final
        rate. SEIRA does not hold escrow accounts; payment is made directly to the vendor.
        Prices agreed upon are final once accepted.
      </p>

      <h2>5. Drawings & Intellectual Property</h2>
      <p>
        Technical drawings uploaded by customers remain the intellectual property of the customer.
        Vendors are permitted to use uploaded drawings solely for the purpose of fulfilling the
        specific order and must not reproduce, share, or repurpose them without written consent.
      </p>

      <h2>6. Liability</h2>
      <p>
        SEIRA is a marketplace facilitator. We are not liable for manufacturing defects, delivery
        delays, or disputes between customers and vendors. We do enforce a verification and review
        system to maintain platform quality.
      </p>

      <h2>7. Vendor Eligibility</h2>
      <p>
        Vendors must maintain accurate business details. SEIRA reserves the right to remove vendors
        with consistently poor ratings (below 3.0 stars) or unresolved dispute histories.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes shall be resolved in the courts
        of Chennai, Tamil Nadu.
      </p>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p>Last updated: April 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide when registering (name, email, company name), placing
        orders (product preferences, proposed rates, delivery dates), uploading drawings, and
        communicating via our in-platform chat system.
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>
        Your information is used solely to facilitate marketplace operations: matching customers
        with vendors, processing payments, enabling order tracking, and supporting dispute resolution.
        We do not sell, rent, or share your personal data with third parties for marketing purposes.
      </p>

      <h2>3. Uploaded Drawings</h2>
      <p>
        Technical drawings and blueprints you upload are stored securely on our servers. They are
        visible only to vendors you have explicitly approved or broadcast your order to. We do not
        share your drawings with any external parties.
      </p>

      <h2>4. Chat Messages</h2>
      <p>
        All in-platform chat messages between customers and vendors are stored to enable dispute
        resolution. Messages are accessible only to the participants of each specific order.
      </p>

      <h2>5. Payment Data</h2>
      <p>
        Payment processing is handled by Razorpay. SEIRA does not store your payment card details.
        Please refer to Razorpay's Privacy Policy for details on how payment data is handled.
      </p>

      <h2>6. Location Data</h2>
      <p>
        Live delivery location data (GPS coordinates) is temporarily stored during active deliveries
        and is deleted after order completion. This data is visible only to the customer and the
        assigned vendor.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy-related queries, contact us at privacy@SEIRAmarket.com.
      </p>
    </div>
  );
}

export function Refund() {
  return (
    <div className="legal-page">
      <h1>Refund Policy</h1>
      <p>Last updated: April 2026</p>

      <h2>Standard Products</h2>
      <p>
        Standard products may be returned and refunded within <strong>14 days of confirmed delivery</strong>,
        provided the product is unused, in its original packaging, and accompanied by proof of
        purchase. Refunds are processed within 7 working days of receiving the returned item.
        Return shipping costs are borne by the customer unless the product was delivered damaged
        or incorrect.
      </p>

      <h2>Custom Manufactured Products</h2>
      <p>
        Custom manufactured products are <strong>strictly non-refundable</strong> once production
        has commenced, except in the following cases:
      </p>
      <p>
        (a) The product has a verifiable manufacturing defect documented within 48 hours of delivery.<br />
        (b) The product materially deviates from the agreed-upon uploaded drawings and specified tolerances.<br />
        (c) Delivery was made more than 30 days past the agreed final delivery date.
      </p>

      <h2>Payment Disputes</h2>
      <p>
        In the event of a payment dispute, please contact our support team at support@SEIRAmarket.com
        within 7 days of the transaction. We will coordinate with Razorpay and the vendor to resolve
        the dispute as quickly as possible.
      </p>

      <h2>Cancellations</h2>
      <p>
        Standard orders can be cancelled before shipment for a full refund. Custom orders can be
        cancelled before production begins for a full refund. Once production has commenced on a
        custom order, cancellation may incur up to 50% of the agreed rate as a cancellation fee.
      </p>
    </div>
  );
}
