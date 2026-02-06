import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { TargetIcon, UsersIcon, TrendingUpIcon, ShieldIcon } from '@/app/components/icons/FinanceIcons';

export function AboutUs() {
  const values = [
    {
      icon: TargetIcon,
      title: 'Customer-Focused',
      description:
        'We build solutions that solve real problems for Nigerian businesses, putting customer needs at the center of everything we do.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: ShieldIcon,
      title: 'Trust & Security',
      description:
        'Bank-level security and compliance with Nigerian banking regulations to protect your business and your customers.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: TrendingUpIcon,
      title: 'Innovation',
      description:
        'Continuous innovation to bring the latest payment technology to the Nigerian market.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: UsersIcon,
      title: 'Partnership',
      description:
        'We partner with businesses for long-term success, providing dedicated support and guidance.',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const team = [
    {
      name: 'Adebayo Okonkwo',
      role: 'CEO & Co-Founder',
      bio: 'Former fintech executive with 15+ years of experience in Nigerian banking.',
    },
    {
      name: 'Chinwe Adeyemi',
      role: 'CTO & Co-Founder',
      bio: 'Technology leader specializing in payment infrastructure and APIs.',
    },
    {
      name: 'Emeka Nnamdi',
      role: 'Head of Product',
      bio: 'Product expert focused on creating delightful user experiences.',
    },
    {
      name: 'Fatima Yusuf',
      role: 'Head of Operations',
      bio: 'Operations specialist ensuring smooth platform performance 24/7.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <SuscriblyLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <Link to="/business/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About Suscribly</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're on a mission to revolutionize recurring payments in Nigeria by making subscription management and direct debit payments simple, secure, and accessible for every business.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-900">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600 leading-relaxed">
                To empower Nigerian businesses with world-class recurring payment infrastructure that drives growth, reduces churn, and creates predictable revenue streams. We believe every business should have access to enterprise-grade payment automation, regardless of size.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-3xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-blue-100 leading-relaxed">
                To become the leading B2B2C subscription management platform in Africa, enabling millions of businesses to build sustainable recurring revenue models while providing their customers with seamless payment experiences.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`h-14 w-14 rounded-lg ${value.color} flex items-center justify-center mb-4`}>
                    <value.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 mb-20 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Active Businesses</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Subscribers</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">₦2B+</div>
              <div className="text-blue-100">Processed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Meet Our Team</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Led by experienced professionals from Nigerian fintech and banking sectors
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-md text-center">
                <CardHeader>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-green-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <CardTitle className="text-lg text-gray-900">{member.name}</CardTitle>
                  <p className="text-sm text-blue-600 font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-white max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Us on Our Journey</h2>
              <p className="text-xl text-gray-600 mb-8">
                Be part of the recurring payment revolution in Nigeria
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/business/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
