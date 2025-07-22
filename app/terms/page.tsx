import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using AdGenius Pro ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                AdGenius Pro is a Google Ads campaign management platform that provides tools for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Managing Google Ads campaigns, ad groups, and keywords</li>
                <li>Monitoring campaign performance and generating reports</li>
                <li>Optimizing advertising budgets and bidding strategies</li>
                <li>Accessing Google Ads data through secure API connections</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Authentication</h2>
              <p className="text-gray-700 mb-4">
                To use our Service, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Have a valid Google Ads account</li>
                <li>Provide accurate and complete information during account setup</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Use the Service to create campaigns that violate Google Ads policies</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated scripts or bots without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Google Ads Integration</h2>
              <p className="text-gray-700 mb-4">
                Our Service integrates with Google Ads through official APIs. By using our Service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You grant us permission to access your Google Ads data as necessary to provide our services</li>
                <li>You remain responsible for all Google Ads campaigns and spending</li>
                <li>You must comply with Google Ads Terms of Service and policies</li>
                <li>You acknowledge that Google Ads charges are separate from our Service fees</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700 mb-4">
                You retain ownership of your data. We process your Google Ads data solely to provide our services and do not use it for any other commercial purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <p className="text-gray-700 mb-4">
                While we strive to maintain high availability, we do not guarantee uninterrupted access to the Service. We may:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Perform scheduled maintenance that may temporarily interrupt service</li>
                <li>Experience downtime due to technical issues or third-party service dependencies</li>
                <li>Modify or discontinue features with reasonable notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, AdGenius Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Loss of data or information</li>
                <li>Costs of substitute services</li>
                <li>Damages resulting from Google Ads campaign performance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless AdGenius Pro from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your Google Ads campaigns and content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate this agreement at any time:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You may stop using the Service and revoke our access to your Google Ads account</li>
                <li>We may terminate your access for violation of these Terms</li>
                <li>We may discontinue the Service with reasonable notice</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Upon termination, we will cease accessing your Google Ads data and delete any stored information as outlined in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service, including its original content, features, and functionality, is owned by AdGenius Pro and is protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@adgeniuspro.com<br/>
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