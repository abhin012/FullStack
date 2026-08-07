# CodeQuest

A full-stack community Q&A and social platform combining Stack Overflow-style question answering with a social content feed, a reputation economy, premium subscriptions, multi-language support, and advanced login security.

**Live demo:** https://full-stack-abhin.vercel.app/
**Backend:** https://fullstack-gtv8.onrender.com/

---

## Tech Stack

**Frontend:** Next.js (Pages Router), React, TypeScript, Tailwind CSS, shadcn/ui, Axios
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT
**Payments:** Razorpay
**Email:** Brevo (transactional email API)
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

---

## Features

### Community Feed
Text, image, and code-snippet posts with type tagging (update / project / achievement). Like, comment, threaded replies, share, bookmark, edit, and delete. Follow other users for a personalized feed. Engagement-weighted trending posts and hashtags. Notifications for likes, comments, mentions, and follows. User reporting with admin review, content removal, and strike-based suspension. Server-side pagination with infinite scroll.

### Q&A + Reputation System
Ask and answer questions with voting, accepted answers, and question closing. Reputation earned/lost for every meaningful action (answering, acceptance, upvotes, downvotes, deletions, moderation, profile completion) — fully logged in a public per-user activity history. Reputation unlocks community privileges at defined thresholds and can be transferred between users with daily/per-transaction limits and a full transaction history.

### Subscriptions & Payments
Four-tier plans (Free / Bronze / Silver / Gold) with daily question quotas, profile badges, and feature gating, billed via Razorpay with server-side signature verification. Auto-generated PDF invoices, email confirmations, and a billing dashboard with payment history.

### Multi-Language Support
Six languages (English, Spanish, Hindi, Portuguese, Chinese, French) with full UI translation. Switching language requires OTP verification — email for French, mobile/SMS for all others — before the change is applied. Language preference is scoped per account.

### Advanced Login Security & Device Management
Every login is recorded with browser, OS, device type, IP, and location. Unrecognized devices require OTP verification before login completes; trusted devices are remembered. Users can view and remotely revoke active sessions from their profile. Sessions auto-expire after 30 days of inactivity; client-side idle timeout logs out after 30 minutes of no activity. Admins have a full login-activity log across all users.

### Forgot Password
Reset via registered email or phone, rate-limited to once per day, with a randomly generated letters-only password.

---

## Getting Started

### Backend
```bash
cd server
npm install
```
Create `server/.env`:
```
MONGODB_URL=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
```
```bash
npm start
```

### Frontend
```bash
cd stack
npm install
```
Create `stack/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```
```bash
npm run dev
```

---

## Notes

- Razorpay is configured in **Test Mode** — use test card `5267 3181 8797 5449` (any future expiry, any CVV) to simulate payments.
- Mobile/SMS OTP delivery is mocked (logged to the server console) since it requires a paid SMS provider; email OTP (French language switch, new-device login, signup verification) is fully functional via Brevo.
- The Render free tier spins down after 15 minutes of inactivity — the first request after idle time may take 30-60 seconds to respond.
