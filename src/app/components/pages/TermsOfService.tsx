import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ReccurLogo } from '@/app/components/ReccurLogo';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <ReccurLogo size="md" showText={true} />
            </Link>
            <Link to="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 24, 2026</p>
        </div>

        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="py-8 prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Reccur's subscription management and recurring payment platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Reccur provides a B2B2C platform that enables businesses to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Manage subscription plans and recurring billing</li>
                <li>Collect automated payments via bank account direct debits</li>
                <li>Track and manage direct debit mandates</li>
                <li>Access analytics and reporting tools</li>
                <li>Integrate via API and webhooks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must create an account to use the Service. You agree to provide accurate, current, and complete information and keep your account information updated.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Fees and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Subscription Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to pay all applicable fees for your chosen subscription plan. Fees are billed in advance on a monthly basis and are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Transaction Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Additional transaction fees may apply based on payment volume. All fees are stated in Nigerian Naira (₦).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Fee Changes</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to change our fees with 30 days' notice. Continued use of the Service after fee changes constitutes acceptance of the new fees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service to defraud customers or engage in deceptive practices</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service and its original content, features, and functionality are owned by Reccur and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, Reccur shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms or the Service shall be resolved through arbitration in Lagos, Nigeria.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these Terms, please contact us:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li><strong>Email:</strong> legal@reccur.ng</li>
                <li><strong>Phone:</strong> +234 (0) 123 456 7890</li>
                <li><strong>Address:</strong> 123 Awolowo Road, Ikoyi, Lagos, Nigeria</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
