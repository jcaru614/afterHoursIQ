# AfterHoursIQ

### AI-powered trading assistant built with Next.js, TypeScript, and OpenAI that analyzes quarterly earnings reports and assigns a rating from 1 to 5 (1 = short, 5 = buy) to help traders make fast, informed after-hours trading decisions. Users provide the upcoming quarter and year, the previous quarter’s press release URL, and the investor relations earnings page. 

### The system predicts the next earnings report URL by adjusting the quarter and year, then monitors the earnings page after market close. Once a new report is detected (using fuzzy URL matching), the content is extracted and passed to OpenAI, which parses the report, identifies key financial metrics, summarizes the results, and generates a predictive rating. 

### This isn’t just a technical solution — it’s built with a trader’s mindset. Every decision in AfterHoursIQ, from report detection to prompt engineering, is designed to deliver fast, accurate, and actionable signals that give traders an edge in the critical minutes after earnings drop. We're not building a backend to explain earnings — we’re building a system to front-run the market and make money off the move.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

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

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
