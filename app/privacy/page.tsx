import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                AdGenius Pro ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Google Ads campaign management service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Google Ads Data</h3>
              <p className="text-gray-700 mb-4">
                When you connect your Google Ads account, we access and process:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Google Ads account information (account IDs, names, currencies)</li>
                <li>Campaign data (names, budgets, statuses, performance metrics)</li>
                <li>Ad group and keyword information</li>
                <li>Performance reports and analytics data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Authentication Information</h3>
              <p className="text-gray-700 mb-4">
                We store OAuth tokens securely to maintain your connection to Google Ads API without requiring frequent re-authentication.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Usage Information</h3>
              <p className="text-gray-700 mb-4">
                We collect information about how you use our service, including feature usage and system performance data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide Google Ads campaign management services</li>
                <li>Display your campaign data and performance metrics</li>
                <li>Enable campaign creation, modification, and optimization</li>
                <li>Generate reports and analytics</li>
                <li>Improve our service functionality and user experience</li>
                <li>Ensure service security and prevent unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>All data transmission is encrypted using HTTPS/TLS</li>
                <li>OAuth tokens are stored securely and never exposed in client-side code</li>
                <li>Access to your data is restricted to authorized personnel only</li>
                <li>We regularly update our security practices and conduct security audits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>With trusted service providers who assist in operating our service (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Google API Services</h2>
              <p className="text-gray-700 mb-4">
                Our use of information received from Google APIs adheres to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </p>
              <p className="text-gray-700 mb-4">
                We only request the minimum necessary permissions to provide our service and do not use Google user data for serving advertisements or other commercial purposes unrelated to our core functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access your personal data we hold</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Revoke access to your Google Ads account at any time</li>
                <li>Export your data in a portable format</li>
                <li>Object to processing of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your data only as long as necessary to provide our services or as required by law. You can request deletion of your data at any time by disconnecting your Google Ads account or contacting us directly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@adgeniuspro.com<br/>
                  <strong>Website:</strong> https://gads-api.vercel.app<br/>
                  <strong>Address:</strong> [Your Business Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}