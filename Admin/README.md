This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Super Admin Protocol

This project includes a secure, classified **Super Admin** layer designed for emergency account recovery and high-level system monitoring.

### 🛡️ Core Functionality
- **Stealth Access**: The Super Admin entry point is invisible by default. Access is triggered by double-clicking empty space on the sidebar and entering the classified protocol password.
- **Dynamic OTP Generation**: For security, account resets generate a cryptographically random One-Time Password (OTP) rather than a static default.
- **Live Audit Engine**: Every action (logins, resets, payment recording, member deletion) is captured in real-time.
- **Identity Tracking**: The system identifies the actual Admin name executing Super Admin powers, ensuring 100% accountability.

### 🔑 Security Protocol
- **Override Password**: Must contain `112000` and exactly 6 alphabetical letters (anywhere in the sequence).
- **Session Control**: Super Admin sessions are strictly limited to 2 hours of inactivity before automatic termination.
- **Audit Trails**: All "Executive Node" activities are recorded in the `AuditLog` table and displayed on the Super Admin dashboard.

---
For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
