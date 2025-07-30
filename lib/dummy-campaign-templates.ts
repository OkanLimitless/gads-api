export interface DummyCampaignTemplate {
  id: string
  name: string
  description: string
  finalUrl: string
  finalMobileUrl?: string
  path1?: string
  path2?: string
  headlines: string[]
  descriptions: string[]
  keywords: string[]
  budgetAmountMicros: number // Budget in micros (e.g., $10 = 10,000,000 micros)
  biddingStrategy: string
  targetCpa?: number
  targetRoas?: number
  locations?: string[]
  languageCode?: string
  adGroupName: string
}

// Predefined dummy campaign templates
export const DUMMY_CAMPAIGN_TEMPLATES: DummyCampaignTemplate[] = [
  {
    id: 'ecommerce-fashion',
    name: 'E-commerce Fashion Store',
    description: 'Template for fashion and clothing online stores',
    finalUrl: 'https://example-fashion-store.com',
    finalMobileUrl: 'https://m.example-fashion-store.com',
    path1: 'fashion',
    path2: 'clothing',
    headlines: [
      'Trendy Fashion Online',
      'Latest Style Collection',
      'Designer Clothes Sale',
      'Fashion Forward Looks',
      'Premium Quality Apparel',
      'Stylish Wardrobe Essentials',
      'Modern Fashion Trends',
      'Exclusive Designer Wear',
      'Affordable Fashion Finds',
      'Chic Style Collection',
      'Contemporary Clothing',
      'Fashion Week Inspired',
      'Luxury Fashion Brands',
      'Seasonal Style Updates',
      'Fashion Forward Designs'
    ],
    descriptions: [
      'Discover the latest fashion trends with our premium collection of designer clothing and accessories.',
      'Shop stylish and affordable fashion online. Free shipping on orders over $50. 30-day returns.',
      'Transform your wardrobe with our curated selection of trendy clothes and fashion accessories.',
      'Premium quality fashion at unbeatable prices. New arrivals weekly. Express delivery available.'
    ],
    keywords: [
      'fashion clothing',
      'designer clothes',
      'trendy apparel',
      'online fashion store',
      'stylish clothing',
      'fashion accessories',
      'designer fashion',
      'clothing sale',
      'fashion trends',
      'premium apparel'
    ],
    budgetAmountMicros: 3000000, // €3 daily budget
    biddingStrategy: 'MAXIMIZE_CLICKS',
    locations: ['2528'], // Netherlands
    languageCode: 'nl',
    adGroupName: 'Fashion Collection'
  },
  {
    id: 'local-restaurant',
    name: 'Local Restaurant',
    description: 'Template for local restaurants and food services',
    finalUrl: 'https://example-restaurant.com',
    finalMobileUrl: 'https://m.example-restaurant.com',
    path1: 'menu',
    path2: 'order',
    headlines: [
      'Best Local Restaurant',
      'Fresh Daily Specials',
      'Authentic Cuisine',
      'Family Owned Restaurant',
      'Award Winning Chef',
      'Farm to Table Dining',
      'Cozy Atmosphere',
      'Seasonal Menu Items',
      'Local Favorite Spot',
      'Fine Dining Experience',
      'Casual Family Dining',
      'Takeout & Delivery',
      'Special Occasion Dining',
      'Local Ingredients Used',
      'Homemade Daily Specials'
    ],
    descriptions: [
      'Experience authentic flavors at our family-owned restaurant. Fresh ingredients, daily specials.',
      'Award-winning local restaurant serving fresh, seasonal dishes. Reservations recommended.',
      'Discover our farm-to-table dining experience with locally sourced ingredients and creative dishes.',
      'Cozy atmosphere, exceptional service, and delicious food. Perfect for any occasion.'
    ],
    keywords: [
      'local restaurant',
      'fine dining',
      'family restaurant',
      'fresh food',
      'daily specials',
      'takeout delivery',
      'authentic cuisine',
      'farm to table',
      'seasonal menu',
      'local dining'
    ],
    budgetAmountMicros: 3000000, // €3 daily budget
    biddingStrategy: 'MAXIMIZE_CLICKS',
    locations: ['2528'], // Netherlands
    languageCode: 'nl',
    adGroupName: 'Restaurant Services'
  },
  {
    id: 'fitness-gym',
    name: 'Fitness Gym & Training',
    description: 'Template for gyms, fitness centers, and personal training',
    finalUrl: 'https://example-fitness-gym.com',
    finalMobileUrl: 'https://m.example-fitness-gym.com',
    path1: 'membership',
    path2: 'training',
    headlines: [
      'Premium Fitness Center',
      'Personal Training Available',
      'State of Art Equipment',
      'Group Fitness Classes',
      '24/7 Gym Access',
      'Certified Trainers',
      'Weight Loss Programs',
      'Strength Training',
      'Cardio Equipment',
      'Fitness Membership',
      'Health & Wellness',
      'Body Transformation',
      'Fitness Goals Achieved',
      'Modern Gym Facilities',
      'Fitness Community'
    ],
    descriptions: [
      'Transform your fitness journey with our state-of-the-art equipment and certified personal trainers.',
      'Join our fitness community today. Group classes, personal training, and 24/7 access available.',
      'Achieve your fitness goals with our comprehensive programs and modern facilities.',
      'Premium gym membership with unlimited access to equipment, classes, and expert guidance.'
    ],
    keywords: [
      'fitness gym',
      'personal training',
      'gym membership',
      'fitness classes',
      'weight training',
      'cardio workout',
      'fitness center',
      'health club',
      'workout facility',
      'fitness programs'
    ],
    budgetAmountMicros: 3000000, // €3 daily budget
    biddingStrategy: 'MAXIMIZE_CLICKS',
    locations: ['2528'], // Netherlands
    languageCode: 'nl',
    adGroupName: 'Fitness Services'
  },
  {
    id: 'tech-services',
    name: 'Technology Services',
    description: 'Template for IT services, web development, and tech consulting',
    finalUrl: 'https://example-tech-services.com',
    finalMobileUrl: 'https://m.example-tech-services.com',
    path1: 'services',
    path2: 'consulting',
    headlines: [
      'Expert Tech Solutions',
      'Web Development Services',
      'IT Consulting Experts',
      'Custom Software Dev',
      'Digital Transformation',
      'Cloud Solutions',
      'Cybersecurity Services',
      'Mobile App Development',
      'Database Management',
      'Tech Support 24/7',
      'Enterprise Solutions',
      'Innovative Technology',
      'Scalable IT Services',
      'Professional Development',
      'Technology Partners'
    ],
    descriptions: [
      'Professional technology services including web development, IT consulting, and digital solutions.',
      'Transform your business with our expert tech services. Custom software, cloud solutions, support.',
      'Comprehensive IT services for businesses of all sizes. From consulting to implementation.',
      'Innovative technology solutions designed to grow your business and improve efficiency.'
    ],
    keywords: [
      'tech services',
      'web development',
      'it consulting',
      'software development',
      'digital solutions',
      'cloud services',
      'cybersecurity',
      'mobile development',
      'tech support',
      'enterprise solutions'
    ],
    budgetAmountMicros: 3000000, // €3 daily budget
    biddingStrategy: 'MAXIMIZE_CLICKS',
    locations: ['2528'], // Netherlands
    languageCode: 'nl',
    adGroupName: 'Technology Solutions'
  },
  {
    id: 'home-services',
    name: 'Home Services & Contractors',
    description: 'Template for home improvement, contractors, and repair services',
    finalUrl: 'https://example-home-services.com',
    finalMobileUrl: 'https://m.example-home-services.com',
    path1: 'services',
    path2: 'quote',
    headlines: [
      'Licensed Contractors',
      'Home Improvement Pros',
      'Quality Repair Services',
      'Free Estimates',
      'Insured & Bonded',
      'Emergency Repairs',
      'Affordable Home Services',
      'Professional Contractors',
      'Home Renovation Experts',
      'Reliable Service Team',
      'Local Home Services',
      'Expert Craftsmanship',
      'Same Day Service',
      'Guaranteed Workmanship',
      'Trusted Professionals'
    ],
    descriptions: [
      'Professional home services and contractors. Licensed, insured, and ready to help with your project.',
      'Quality home improvement and repair services. Free estimates, guaranteed workmanship.',
      'Trusted local contractors for all your home service needs. Emergency repairs available.',
      'Expert home services with reliable professionals. Same-day service and competitive pricing.'
    ],
    keywords: [
      'home services',
      'contractors',
      'home repair',
      'home improvement',
      'renovation services',
      'handyman services',
      'emergency repairs',
      'licensed contractors',
      'home maintenance',
      'repair services'
    ],
    budgetAmountMicros: 3000000, // €3 daily budget
    biddingStrategy: 'MAXIMIZE_CLICKS',
    locations: ['2528'], // Netherlands
    languageCode: 'nl',
    adGroupName: 'Home Services'
  }
]

// Helper function to get template by ID
export function getTemplateById(templateId: string): DummyCampaignTemplate | undefined {
  return DUMMY_CAMPAIGN_TEMPLATES.find(template => template.id === templateId)
}

// Helper function to get all template names and IDs for selection
export function getTemplateOptions(): Array<{ id: string; name: string; description: string }> {
  return DUMMY_CAMPAIGN_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description
  }))
}

// Helper function to customize template for specific account
export function customizeTemplateForAccount(
  template: DummyCampaignTemplate,
  accountName: string,
  customizations?: Partial<DummyCampaignTemplate>
): DummyCampaignTemplate {
  return {
    ...template,
    name: `${template.name} - ${accountName}`,
    adGroupName: `${template.adGroupName} - ${accountName}`,
    ...customizations
  }
}