import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import { ShieldIcon, CheckCircleIcon, LockIcon, FileTextIcon } from '@/app/components/icons/FinanceIcons';

export function Compliance() {
  const certifications = [
    {
      icon: ShieldIcon,
      title: 'CBN Compliance',
      description: 'Fully compliant with Central Bank of Nigeria (CBN) regulations for payment services.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: LockIcon,
      title: 'PCI DSS',
      description: 'Payment Card Industry Data Security Standard Level 1 certified for data protection.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: CheckCircleIcon,
      title: 'ISO 27001',
      description: 'Information security management systems certified to international standards.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: FileTextIcon,
      title: 'NDPR Compliant',
      description: 'Adherence to Nigeria Data Protection Regulation for privacy and data protection.',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Compliance & Security</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We take security and compliance seriously. Reccur meets the highest standards for financial services and data protection in Nigeria.
          </p>
        </div>

        {/* Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {certifications.map((cert, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <div className={`h-16 w-16 rounded-lg ${cert.color} flex items-center justify-center mx-auto mb-4`}>
                  <cert.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl text-gray-900">{cert.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{cert.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Regulatory Compliance */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Regulatory Compliance</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Central Bank of Nigeria (CBN)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Reccur operates in full compliance with CBN guidelines for payment service providers. We maintain proper licensing and adhere to all regulatory requirements for direct debit and recurring payment services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Nigeria Data Protection Regulation (NDPR)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              We are fully compliant with NDPR requirements, implementing comprehensive data protection measures including data minimization, purpose limitation, and ensuring rights of data subjects.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Anti-Money Laundering (AML)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our platform includes robust AML controls including transaction monitoring, customer due diligence, and suspicious activity reporting in line with Nigerian financial regulations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Know Your Customer (KYC)</h3>
            <p className="text-gray-700 leading-relaxed">
              We implement strict KYC procedures for all tenant businesses using our platform, ensuring proper identity verification and business legitimacy checks.
            </p>
          </CardContent>
        </Card>

        {/* Security Measures */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Security Measures</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Encryption</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>256-bit SSL/TLS encryption for data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>End-to-end encryption for sensitive data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Controls</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Multi-factor authentication (MFA)</li>
                  <li>Role-based access control (RBAC)</li>
                  <li>Regular access audits and reviews</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Infrastructure Security</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>24/7 security monitoring</li>
                  <li>Regular penetration testing</li>
                  <li>DDoS protection and firewalls</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Operational Security</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Regular security audits</li>
                  <li>Incident response procedures</li>
                  <li>Employee security training</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Data Privacy Commitments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Data Minimization:</strong> We only collect data necessary for providing our services.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Purpose Limitation:</strong> Personal data is used only for specified, explicit, and legitimate purposes.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Data Subject Rights:</strong> Users can access, correct, delete, or port their data at any time.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Breach Notification:</strong> We commit to notifying affected parties within 72 hours of any data breach.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Third-Party Vetting:</strong> All third-party service providers are carefully vetted for compliance and security.
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Audit & Reporting */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Audit & Reporting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              We conduct regular internal and external audits to ensure ongoing compliance with all applicable regulations and standards:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Quarterly internal security audits</li>
              <li>Annual third-party penetration testing</li>
              <li>Regular compliance assessments</li>
              <li>Annual financial audits</li>
              <li>Continuous vulnerability scanning</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-green-600 text-white max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Questions About Compliance?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Our compliance team is available to answer your questions and provide additional documentation.
              </p>
              <Link to="/contact">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Contact Compliance Team
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
