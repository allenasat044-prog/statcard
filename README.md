# ⚡ StatCard

**Your life. Your stats.**

A game-style personal stats website where you can track and compare your real-world stats across Sports, Finance, Political Power, and Education — like a character sheet for real life.

🔗 **Live Site:** [statcard-ashen.vercel.app](https://statcard-ashen.vercel.app)

---

## 🎮 What is StatCard?

StatCard turns your real-world achievements into a game-style radar chart. Connect your accounts, fill in your stats, and compete on a global leaderboard.

Each player gets a stat card with 4 categories:

| Category | Stats | Source |
|----------|-------|--------|
| 🏃 Sports / Health | Stamina, Strength, Agility, Endurance, Speed, Recovery | Strava API |
| 💰 Finance / Money | Wealth, Income, Investments, Savings, Assets, Credit | NetWorth Calculator |
| ⚡ Political / Power | Influence, Reach, Network, Authority, Repute, Alliances | Influence Meter |
| 🎓 Education / Expertise | IQ, Knowledge, Skills, Creativity, Expertise, Learning | GitHub API |

---

## ✅ Features

- 🔐 Email/password authentication via Supabase
- 📊 Radar/spider chart for each category
- 🐙 GitHub integration — auto-calculates Education stats from real repos
- 🏃 Strava integration — auto-calculates Sports stats from real activities
- 💰 Finance calculator — estimates wealth score from income, assets, investments
- ⚡ Influence meter — calculates Political Power from Instagram, LinkedIn, Twitter/X, YouTube
- 🏆 Global leaderboard with tier rankings (Bronze → Silver → Gold → Legendary)
- ✅ Verified badges for connected accounts
- 📱 Mobile responsive

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel |
| APIs | GitHub API, Strava API |

**Cost: ₹0** — everything runs on free tiers.

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/allenasat044-prog/statcard.git
cd statcard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
- Create a project at [supabase.com](https://supabase.com)
- Run the SQL schema (see `schema.sql`)
- Copy your Project URL and anon key

### 4. Add environment variables
Create a `.env` file:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run locally
```bash
npm start
```

---

## 📁 Project Structure

```
src/
├── App.js                  # Root component, auth state
├── Auth.js                 # Login / signup page
├── StatCard.js             # Main stat card with radar chart
├── Leaderboard.js          # Global leaderboard
├── GitHubConnect.js        # GitHub OAuth + stats calculator
├── StravaConnect.js        # Strava OAuth + stats calculator
├── FinanceCalculator.js    # 3-step finance estimator
├── InfluenceCalculator.js  # Social media influence meter
└── supabaseClient.js       # Supabase client config
```

---

## 🏆 Tier System

| Tier | Score Range |
|------|-------------|
| 🟤 Bronze | 0 - 54 |
| ⚪ Silver | 55 - 69 |
| 🟡 Gold | 70 - 84 |
| 🔥 Legendary | 85 - 100 |

---

## 📸 Screenshots

> Coming soon

---

## 🗺 Roadmap

- [ ] Shareable public profile URLs (`/u/username`)
- [ ] Animated radar chart on load
- [ ] Percentile rank by country/region
- [ ] Weekly stat updates
- [ ] Mobile app (React Native)

---

## 👤 Author

**Shanks** — [github.com/allenasat044-prog](https://github.com/allenasat044-prog)

---

## 📄 License

MIT License — free to use and modify.
