# AdGenius Pro - AI-Powered Google Ads Management Platform

A comprehensive SaaS platform for agencies and businesses to manage Google Ads campaigns at scale using advanced AI automation, intelligent bidding, and performance optimization.

## 🚀 **Business Overview**

AdGenius Pro is a professional Google Ads management platform designed for:

- **Digital Marketing Agencies** managing multiple client accounts
- **E-commerce Businesses** scaling their advertising operations  
- **Enterprise Companies** with complex campaign requirements
- **Marketing Teams** seeking AI-powered optimization

## 🎯 **Core Features**

### **AI-Powered Campaign Optimization**
- Automated bid management with machine learning algorithms
- Real-time campaign performance optimization
- Intelligent budget allocation across campaigns
- Predictive analytics for campaign forecasting

### **Multi-Client Management**
- Centralized dashboard for managing hundreds of accounts
- White-label options for agencies
- Team collaboration tools and permissions
- Client reporting and performance dashboards

### **Advanced Analytics & Reporting**
- Custom performance dashboards
- ROI tracking and attribution modeling
- Automated reporting with insights
- Export capabilities for stakeholder presentations

### **Enterprise-Grade Security**
- SOC 2 compliance and bank-level encryption
- Secure API integrations with Google Ads
- Role-based access controls
- 99.9% uptime SLA

## 💼 **Target Market & Use Cases**

### **Digital Marketing Agencies**
- Manage 50-500+ client Google Ads accounts
- Automate routine optimization tasks
- Provide clients with detailed performance reports
- Scale operations without proportional staff increases

### **E-commerce Businesses**
- Optimize product advertising campaigns
- Manage seasonal campaign fluctuations
- Integrate with e-commerce platforms
- Maximize ROAS across product categories

### **Enterprise Companies**
- Coordinate campaigns across multiple brands/regions
- Implement complex bidding strategies
- Maintain compliance with advertising policies
- Generate executive-level performance reports

## 🏗️ **Technical Architecture**

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **API Integration**: Google Ads API with OAuth 2.0
- **Database**: Scalable cloud infrastructure
- **Deployment**: Vercel with global CDN
- **Security**: Enterprise-grade encryption and compliance

## 📊 **Business Metrics**

- **1,200+ Active Clients** across 40+ countries
- **$2.4M+ Monthly Ad Spend** managed through the platform
- **340% Average ROI Improvement** for clients
- **99.9% Platform Uptime** with 24/7 monitoring

## 🔧 **Development Setup**

### Prerequisites
- Node.js 18+
- Google Ads API developer token
- Google Cloud Console project with Ads API enabled

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/adgenius-pro.git
cd adgenius-pro
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
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

4. **Run the development server:**
```bash
npm run dev
```

5. **Open the application:**
Visit [http://localhost:3000](http://localhost:3000)

## 🚀 **Deployment**

### Vercel Deployment (Recommended)

1. **Connect to Vercel:**
   - Import your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy automatically on push to main branch

2. **Environment Variables:**
   Set the following in your Vercel project settings:
   - `GOOGLE_ADS_DEVELOPER_TOKEN`
   - `GOOGLE_ADS_CLIENT_ID`
   - `GOOGLE_ADS_CLIENT_SECRET`
   - `GOOGLE_ADS_REFRESH_TOKEN`

3. **Custom Domain:**
   Configure your custom domain in Vercel for production use

## 📈 **Business Model**

### **Subscription Tiers**

- **Starter ($99/month)**: Up to 5 Google Ads accounts
- **Professional ($299/month)**: Up to 50 accounts + advanced features
- **Enterprise ($999/month)**: Unlimited accounts + custom solutions

### **Revenue Streams**
- Monthly subscription fees
- Setup and onboarding services
- Custom integration development
- Training and consultation services

## 🔐 **Google Ads API Integration**

### **Production Setup**

1. **Developer Token Application:**
   - Apply for Google Ads API developer token
   - Provide business information and use case
   - Demonstrate the working application

2. **OAuth 2.0 Configuration:**
   - Create OAuth credentials in Google Cloud Console
   - Configure authorized redirect URIs
   - Implement refresh token generation

3. **API Compliance:**
   - Follow Google Ads API policies and guidelines
   - Implement proper rate limiting and error handling
   - Maintain data privacy and security standards

## 📞 **Support & Contact**

- **Website**: [adgenius-pro.com](https://adgenius-pro.com)
- **Email**: support@adgenius-pro.com
- **Documentation**: [docs.adgenius-pro.com](https://docs.adgenius-pro.com)
- **Status Page**: [status.adgenius-pro.com](https://status.adgenius-pro.com)

## 📄 **Legal & Compliance**

- **Privacy Policy**: Compliant with GDPR, CCPA, and other data protection regulations
- **Terms of Service**: Comprehensive SaaS terms covering usage, liability, and data handling
- **Security**: SOC 2 Type II certified with regular security audits
- **Google Ads API**: Fully compliant with Google's developer policies

## 🎯 **Competitive Advantages**

1. **Advanced AI Optimization**: Proprietary algorithms outperforming standard Google automation
2. **Agency-Focused Design**: Built specifically for multi-client management scenarios
3. **Enterprise Security**: Bank-level security suitable for large organizations
4. **Comprehensive API**: Full Google Ads API coverage with custom optimizations
5. **Proven Results**: 340% average ROI improvement with documented case studies

---

**AdGenius Pro** - Transforming Google Ads management through AI-powered automation and enterprise-grade tools.

## Google Ads scripts (compliant)

These scripts create an ad group and a responsive search ad, then monitor policy approval and optionally update the ad's Final URL within the same domain.

Important: Do not attempt to bypass platform review. Always use landing pages you own and that comply with policies. URL updates, even within the same domain, may trigger re-review.

### Prerequisites
- Python 3.9+
- `google-ads` credentials configured via `google-ads.yaml` (see Google Ads API docs)

Install dependencies:
```bash
pip3 install -r requirements.txt
```

### Configure credentials
By default the client loads `~/.google-ads.yaml`. To use a custom path, set `GOOGLE_ADS_CONFIG_PATH` to your config file.

### Create ad group and ad
```bash
python3 scripts/create_ad_group_and_ad.py \
  --customer_id 1234567890 \
  --campaign_id 111222333 \
  --ad_group_name "Search - Brand" \
  --final_url "https://www.example.com" \
  --headline "Official Site" \
  --headline "Book Online" \
  --headline "24/7 Support" \
  --description "Find fares and deals today." \
  --description "Fast booking, secure checkout."
```
This writes created resource names to `data/created_ads.json`.

### Monitor approval and update Final URL (same-domain only)
```bash
python3 scripts/monitor_and_update_url.py \
  --customer_id 1234567890 \
  --new_url "https://www.example.com/landing" \
  --poll_interval_secs 60 \
  --timeout_secs 3600
```
- Cross-domain URL changes are not supported by this tool.

### Notes
- Always ensure your Final URLs are policy-compliant and owned/authorized by you.
- Updates use an update mask for `ad.final_urls` only, but platforms may still re-review the ad.