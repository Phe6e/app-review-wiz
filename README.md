# App Review Analytics

## Demo

| Version | Link |
|---------|------|
| 🇰🇷 Korean | app-review-wiz.lovable.app |
| 🇯🇵 Japanese | --https://app-review-2ur1q46j1-phe6es-projects.vercel.app/ | --modifying

---

> A web application that collects app reviews from the App Store (KR, JP, and US) and provides sentiment analysis. Supports side-by-side comparison of the latest reviews across apps. Google Play Store is currently unavailable due to API pricing constraints.

## Screenshots

<!-- To add screenshots:
1. Take a screenshot of the web app
2. Go to your GitHub repository page
3. Click on "Issues" > "New Issue"
4. Drag & drop your image into the text box — GitHub will generate a URL like: https://github.com/user-attachments/assets/...
5. Copy that URL and paste it here:

![App Screenshot](https://github.com/user-attachments/assets/dd879606-459c-408e-ab12-0634763d7332)
-->
![App Screenshot](https://github.com/user-attachments/assets/dd879606-459c-408e-ab12-0634763d7332)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Charts | Recharts |
| Data Fetching | TanStack React Query |
| Backend | Supabase Edge Functions (Deno) |
| AI Analysis | Google Gemini API (`gemini-2.5-flash`) |
| Data Source | Apple iTunes Search API + App Store RSS Feed |
| Deployment | Vercel |

## Features

- **App Search** — Search iOS apps by name across KR, JP, and US App Store regions
- **Review Fetching** — Load the latest reviews with pagination ("Load More")
- **AI Sentiment Analysis** — Automatically classifies each review as positive, negative, or neutral using Gemini
- **Keyword Extraction** — Extracts key topics from reviews and displays them as a weighted keyword cloud
- **AI Summary Badges** — Each review gets a concise 2–4 word AI-generated summary badge
- **Sentiment Distribution Chart** — Donut chart showing the ratio of positive / negative / neutral reviews
- **Rating Distribution Chart** — Bar chart breaking down reviews by star rating (1–5)
- **Date Range Filtering** — Filter reviews by time period (last 1 week, 1 month, 3 months, etc.)
- **Version Comparison** — Compare sentiment trends across different app versions
- **Churn Risk Detection** — Highlights reviews that suggest user churn risk
- **Competitor Comparison** — Side-by-side comparison tab for analyzing multiple apps
- **Bilingual UI** — Korean (`main` branch) and Japanese (`japanese` branch) language support
- **Store Color Themes** — Distinct color schemes for App Store vs Google Play
- **Mock Data Fallback** — Falls back to sample data when the API is unavailable

---
