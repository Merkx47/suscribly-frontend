import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import { BriefcaseIcon, UsersIcon, TrendingUpIcon, HeartIcon, MapPinIcon, NairaIcon } from '@/app/components/icons/FinanceIcons';

export function Careers() {
  const openPositions = [
    {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Build scalable payment infrastructure for the Nigerian market.',
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Drive product strategy and roadmap for our subscription platform.',
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Help our customers succeed with Reccur and grow their businesses.',
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Ensure platform reliability and performance at scale.',
    },
    {
      title: 'Sales Executive',
      department: 'Sales',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Drive business growth by partnering with Nigerian businesses.',
    },
  ];

  const benefits = [
    {
      icon: NairaIcon,
      title: 'Competitive Salary',
      description: 'Market-leading compensation packages with performance bonuses',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: HeartIcon,
      title: 'Health Insurance',
      description: 'Comprehensive health coverage for you and your family',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: TrendingUpIcon,
      title: 'Career Growth',
      description: 'Learning budget and clear career progression paths',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: UsersIcon,
      title: 'Great Culture',
      description: 'Work with talented people in a collaborative environment',
      color: 'bg-purple-100 text-purple-600',
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us build the future of recurring payments in Nigeria. Work on challenging problems with a talented team.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Work at Reccur?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <div className={`h-14 w-14 rounded-lg ${benefit.color} flex items-center justify-center mx-auto mb-4`}>
                    <benefit.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Open Positions</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're always looking for talented people to join our team
          </p>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{position.title}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {position.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <BriefcaseIcon className="h-4 w-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {position.location}
                        </span>
                      </div>
                      <p className="text-gray-600">{position.description}</p>
                    </div>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 ml-4">
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Culture Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-4xl font-bold mb-4">Our Culture</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              At Reccur, we believe in building a diverse, inclusive environment where everyone can do their best work.
              We value innovation, collaboration, and continuous learning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-5xl font-bold mb-2">50+</div>
                <div className="text-blue-100">Team Members</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">10+</div>
                <div className="text-blue-100">Departments</div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">100%</div>
                <div className="text-blue-100">Remote Friendly</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-white max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Don't See Your Role?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We're always interested in meeting talented people. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Get in Touch
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
