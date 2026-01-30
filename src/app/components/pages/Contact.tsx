import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Thank you! We will get back to you within 24 hours.');
    setFormData({ name: '', email: '', company: '', phone: '', message: '' });
  };

  const contactInfo = [
    {
      icon: MailIcon,
      title: 'Email',
      content: 'hello@reccur.ng',
      description: 'Send us an email anytime',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      content: '+234 (0) 123 456 7890',
      description: 'Mon-Fri from 9am to 6pm',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: MapPinIcon,
      title: 'Office',
      content: 'Lagos, Nigeria',
      description: '123 Awolowo Road, Ikoyi',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: ClockIcon,
      title: 'Support Hours',
      content: '24/7 Support',
      description: 'We\'re here to help anytime',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <div className={`h-14 w-14 rounded-lg ${info.color} flex items-center justify-center mx-auto mb-4`}>
                  <info.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-lg text-gray-900">{info.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-gray-900 mb-1">{info.content}</p>
                <p className="text-sm text-gray-600">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <Card className="border-0 shadow-xl h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Send us a Message</CardTitle>
              <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your Company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  size="lg"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6 flex flex-col">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-green-600 text-white flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Looking for Sales?</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-blue-100 mb-6 flex-1">
                  Interested in our enterprise solutions or have questions about pricing? Our sales team is ready to help.
                </p>
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 mt-auto"
                  size="lg"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Need Technical Support?</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-600 mb-6 flex-1">
                  If you're an existing customer with a technical issue, please visit our support portal for faster assistance.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-auto"
                  size="lg"
                >
                  Visit Support Portal
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-600 mb-6 flex-1">
                  Find quick answers to common questions in our comprehensive FAQ section.
                </p>
                <Link to="/#faq" className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Browse FAQs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
