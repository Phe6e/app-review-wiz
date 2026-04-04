# App Review Analytics

## Demo

| Version | Link |
|---------|------|
| 🇰🇷 Korean | https://app-review-fr3ptj0aa-phe6es-projects.vercel.app/ |
| 🇯🇵 Japanese | https://app-review-2ur1q46j1-phe6es-projects.vercel.app/ |

---

> A web application that collects app reviews from the App Store (KR, JP, and US) and provides sentiment analysis. Supports side-by-side comparison of the latest reviews across apps. Google Play Store is currently unavailable due to API pricing constraints.

## Screenshots

<!-- To add screenshots:
1. Take a screenshot of the web app
2. Go to your GitHub repository page
3. Click on "Issues" > "New Issue"
4. Drag & drop your image into the text box — GitHub will generate a URL like: https://github.com/user-attachments/assets/...
5. Copy that URL and paste it here:

![App Screenshot](https://github.com/user-attachments/assets/YOUR-IMAGE-URL)
-->

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

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
