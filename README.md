# AdGenius Creator

A modern Google Ads campaign management tool built with Next.js 14, TypeScript, and Tailwind CSS. This application provides a comprehensive interface for managing Google Ads campaigns, ad groups, and keywords.

## Features

- 📊 **Dashboard Overview** - Real-time statistics and campaign metrics
- 🎯 **Campaign Management** - Create, edit, and manage Google Ads campaigns
- 👥 **Ad Group Organization** - Organize ads into targeted groups
- 🔍 **Keyword Management** - Add and manage keywords with different match types
- 💰 **Budget & Bidding Control** - Set budgets and bidding strategies
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- ⚡ **Fast Performance** - Built with Next.js 14 for optimal performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Google Ads API**: google-ads-api library
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google Ads API access
- Developer token from Google Ads

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd adgenius-creator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Google Ads API credentials:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Ads API Setup

To use this application with real Google Ads data, you need to:

1. **Get a Developer Token**:
   - Apply for a developer token from the Google Ads API
   - This can take several days to be approved

2. **Create OAuth 2.0 Credentials**:
   - Go to Google Cloud Console
   - Create a new project or use existing one
   - Enable Google Ads API
   - Create OAuth 2.0 credentials

3. **Generate Refresh Token**:
   - Use Google OAuth 2.0 playground or custom implementation
   - Generate a refresh token for API access

4. **Configure Environment Variables**:
   - Add all credentials to your `.env.local` file

## Demo Mode

The application includes mock data for demonstration purposes. This allows you to:
- Explore the interface without API setup
- Test functionality before connecting to real accounts
- Show the application to stakeholders

## Deployment on Vercel

This application is optimized for Vercel deployment:

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Environment Variables in Vercel**:
   - Go to your project settings in Vercel
   - Add all environment variables from `.env.local`

## Project Structure

```
adgenius-creator/
├── app/                   # Next.js 14 app directory
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── CampaignManager.tsx
│   ├── AdGroupManager.tsx
│   └── KeywordManager.tsx
├── lib/                 # Utility functions
│   ├── google-ads.ts    # Google Ads API integration
│   └── utils.ts         # General utilities
└── public/              # Static assets
```

## API Routes

- `GET /api/campaigns` - Fetch campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/ad-groups` - Fetch ad groups
- `POST /api/ad-groups` - Create new ad group
- `GET /api/keywords` - Fetch keywords
- `POST /api/keywords` - Add new keyword

## Key Features

### Campaign Management
- Create campaigns with custom budgets and bidding strategies
- Support for multiple bidding types (Maximize Clicks, Target CPA, etc.)
- Campaign status management (Active/Paused)

### Ad Group Organization
- Create ad groups within campaigns
- Set individual max CPC bids
- Organize ads by themes or product categories

### Keyword Targeting
- Add keywords with different match types (Broad, Phrase, Exact)
- Individual keyword bidding
- Visual match type indicators

### Modern UI/UX
- Responsive design for all devices
- Intuitive navigation with tabs
- Real-time data updates
- Loading states and error handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support with:
- **Google Ads API**: Check the [official documentation](https://developers.google.com/google-ads/api)
- **Next.js**: Visit [Next.js documentation](https://nextjs.org/docs)
- **Application Issues**: Open an issue in this repository

## Acknowledgments

- Google Ads API team for the excellent API
- Vercel for the amazing deployment platform
- Radix UI for the accessible component primitives
- Tailwind CSS for the utility-first CSS framework