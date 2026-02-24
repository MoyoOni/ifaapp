import React, { useState } from 'react';
import { HelpCircle, Search, Mail, Phone, MessageCircle, BookOpen, Users, Shield, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "How do I book a consultation with a Babalawo?",
      answer: "Visit the 'Find a Babalawo' section, browse verified practitioners, and click 'Request Consultation' on any Babalawo's profile. You can then select your preferred date and time."
    },
    {
      id: 2,
      question: "What payment methods are accepted?",
      answer: "We accept payments through your wallet balance. You can add funds to your wallet using bank transfer or card payments. All transactions are securely processed."
    },
    {
      id: 3,
      question: "How do I join a temple or circle?",
      answer: "Browse the 'Temples' or 'Circles' sections to find communities near you. Click 'Join' on any community that interests you, and your request will be reviewed by the administrators."
    },
    {
      id: 4,
      question: "What is the marketplace for?",
      answer: "Our marketplace connects you with verified vendors selling authentic spiritual artifacts, books, and ceremonial items. All products are vetted for quality and authenticity."
    },
    {
      id: 5,
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your inbox to reset your password."
    },
    {
      id: 6,
      question: "Can I cancel a booked consultation?",
      answer: "Yes, you can cancel consultations up to 24 hours before the scheduled time. Cancellations made less than 24 hours in advance may incur a fee."
    }
  ];

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of using Ìlú Àṣẹ',
      items: [
        'Creating your account',
        'Setting up your profile',
        'Understanding the dashboard',
        'Navigating the platform'
      ]
    },
    {
      id: 'consultations',
      title: 'Consultations',
      icon: Users,
      description: 'Booking and managing spiritual guidance sessions',
      items: [
        'Finding the right Babalawo',
        'Booking consultations',
        'Preparing for your session',
        'Following up on guidance'
      ]
    },
    {
      id: 'community',
      title: 'Community',
      icon: MessageCircle,
      description: 'Connecting with temples, circles, and fellow seekers',
      items: [
        'Joining communities',
        'Participating in discussions',
        'Attending events',
        'Building connections'
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      icon: Search,
      description: 'Buying authentic spiritual items',
      items: [
        'Browsing products',
        'Making purchases',
        'Vendor verification',
        'Shipping and delivery'
      ]
    },
    {
      id: 'account',
      title: 'Account & Security',
      icon: Shield,
      description: 'Managing your account and staying secure',
      items: [
        'Account settings',
        'Privacy controls',
        'Security features',
        'Data protection'
      ]
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-highlight/10 rounded-full mb-6">
            <HelpCircle className="text-highlight" size={24} />
            <span className="font-bold text-highlight uppercase tracking-wider">Help Center</span>
          </div>
          
          <h1 className="text-4xl font-bold text-stone-800 brand-font mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Find answers to common questions or get personalized support
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help topics..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-highlight focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-stone-800 mb-8 text-center">Browse Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    // In real app, this would navigate to category-specific help
                    console.log(`Selected category: ${category.id}`);
                  }}
                >
                  <div className="w-12 h-12 bg-highlight/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-highlight/20 transition-colors">
                    <IconComponent className="text-highlight" size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-stone-800 mb-2">{category.title}</h3>
                  <p className="text-stone-600 text-sm mb-4">{category.description}</p>
                  <ul className="space-y-1">
                    {category.items.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-stone-500 text-xs flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-highlight rounded-full"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-sm font-bold text-highlight group-hover:text-yellow-700 transition-colors">
                    <span>Explore topics</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-stone-800 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500">No FAQs match your search. Try different keywords.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
                  >
                    <h3 className="font-bold text-stone-800 pr-4">{faq.question}</h3>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="text-stone-400 flex-shrink-0" size={20} />
                    ) : (
                      <ChevronDown className="text-stone-400 flex-shrink-0" size={20} />
                    )}
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-5 pt-2 border-t border-stone-100">
                      <p className="text-stone-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-highlight to-amber-600 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="mb-6 opacity-90">Our support team is here to assist you</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-highlight font-bold rounded-xl hover:bg-stone-100 transition-colors">
              <Mail size={18} />
              Email Support
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
              <Phone size={18} />
              Call Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;