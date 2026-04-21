import React, { useState } from 'react';
import { BookOpen, Play, GraduationCap, Info, X, ChevronRight } from 'lucide-react';

interface CulturalOnboardingPathProps {
  onContinue: () => void;
}

/**
 * Cultural Onboarding Path Component
 * Provides glossary, video guide, course links, and cultural context for diaspora users
 */
const CulturalOnboardingPath: React.FC<CulturalOnboardingPathProps> = ({ onContinue }) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'video' | 'course' | 'guide'>('glossary');

  const glossaryTerms = [
    {
      term: 'Àṣẹ',
      pronunciation: 'ah-shay',
      definition: 'Spiritual authority, power, and blessing. The ability to make things happen through divine will.',
      example: 'The Babalawo invoked Àṣẹ before beginning the divination.',
    },
    {
      term: 'Babaláwo',
      pronunciation: 'bah-bah-LAH-woh',
      definition: 'A priest of Ifá, a diviner and spiritual guide who interprets the Odù (sacred verses).',
      example: 'My Babaláwo helped me understand the meaning of the divination.',
    },
    {
      term: 'Odù',
      pronunciation: 'oh-DOO',
      definition: 'Sacred verses and teachings of Ifá, revealed through divination. There are 256 Odù.',
      example: 'The Odù revealed guidance for my situation.',
    },
    {
      term: 'Ilé Ifá',
      pronunciation: 'ee-LAY ee-FAH',
      definition: 'A temple or house of Ifá, a physical and spiritual space where Ifá is practiced.',
      example: 'I visited the Ilé Ifá to learn more about the tradition.',
    },
    {
      term: 'Akose',
      pronunciation: 'ah-KOH-say',
      definition: 'A spiritual remedy or ritual prescribed after divination to address specific issues.',
      example: 'The Babaláwo prescribed an Akose to help with my situation.',
    },
    {
      term: 'Ebo',
      pronunciation: 'EH-boh',
      definition: 'A sacrifice or offering made to the Orishas (deities) as part of spiritual practice.',
      example: 'We performed an Ebo to honor the ancestors.',
    },
    {
      term: 'Opele',
      pronunciation: 'oh-PEH-leh',
      definition: 'A divination chain used by Babalawos to cast and interpret Odù.',
      example: 'The Babaláwo cast the Opele to determine the Odù.',
    },
    {
      term: 'Iyanifa',
      pronunciation: 'ee-yah-NEE-fah',
      definition: 'A female priestess of Ifá, equivalent to Babaláwo.',
      example: 'The Iyanifa conducted the ceremony.',
    },
    {
      term: 'Oluwo',
      pronunciation: 'oh-LOO-woh',
      definition: 'A senior Babaláwo who has reached the highest level of initiation and can found an Ilé Ifá.',
      example: 'Only an Oluwo can establish a new Ilé Ifá.',
    },
    {
      term: 'Isese',
      pronunciation: 'ee-SEH-seh',
      definition: 'The traditional Yoruba religion and spiritual practice, including Ifá.',
      example: 'I am learning about Isese to reconnect with my heritage.',
    },
  ];

  return (
    <div className="bg-card rounded-[3rem] p-10 md:p-12 border border-border/50 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold brand-font text-foreground">
          Welcome to Your Cultural Journey
        </h3>
        <button
          onClick={onContinue}
          className="p-2 hover:bg-muted/60 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <p className="text-muted-foreground">
        We're here to support you as you reconnect with your heritage. Explore these resources to get started.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'glossary'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Glossary
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'video'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Play className="w-4 h-4 inline mr-2" />
          Video Guide
        </button>
        <button
          onClick={() => setActiveTab('course')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'course'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="w-4 h-4 inline mr-2" />
          Course
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'guide'
              ? 'text-highlight border-b-2 border-highlight'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-4 h-4 inline mr-2" />
          Guide
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'glossary' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Key Terms Glossary</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {glossaryTerms.map((term, index) => (
                <div
                  key={index}
                  className="bg-muted/40 rounded-xl p-4 border border-border/50 hover:border-highlight/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-bold text-foreground text-lg">{term.term}</h5>
                      <p className="text-sm text-muted-foreground italic">{term.pronunciation}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-2">{term.definition}</p>
                  <p className="text-xs text-muted-foreground italic">Example: {term.example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">What to Expect in a Divination</h4>
            <div className="space-y-6">
              <div className="bg-muted/40 rounded-xl p-6 border border-border/50">
                <h5 className="font-bold text-foreground text-lg mb-3">Introduction to Ifá Divination</h5>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/Xp9XpQPx50g" 
                    title="Introduction to Ifá Divination" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Learn about the fundamentals of Ifá divination, its cultural significance, and how it connects 
                  practitioners and seekers in a sacred dialogue.
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-6 border border-border/50">
                <h5 className="font-bold text-foreground text-lg mb-3">Your First Divination Session</h5>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/4a48V6WQ_NM" 
                    title="Your First Divination Session" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Understand what happens during a typical divination session, how to prepare, and what to expect 
                  from your interaction with a Babaláwo.
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-6 border border-border/50">
                <h5 className="font-bold text-foreground text-lg mb-3">Respectful Engagement with Tradition</h5>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/3tJzMb6jL88" 
                    title="Respectful Engagement with Tradition" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Discover the appropriate ways to approach the tradition, show respect, and build meaningful 
                  relationships with practitioners.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'course' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Introduction to Ifá/Isese</h4>
            <div className="bg-muted/40 rounded-xl p-6 border border-border/50 space-y-4">
              <p className="text-foreground">
                We recommend starting with our beginner Academy course: <strong>"Introduction to Ifá/Isese"</strong>
              </p>
              <div className="bg-card rounded-lg p-4 border border-border">
                <h5 className="font-bold text-foreground mb-2">Course Topics:</h5>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Understanding the basics of Ifá and Isese</li>
                  <li>The role of Babaláwo and Iyanifa</li>
                  <li>What to expect in a divination session</li>
                  <li>Respecting cultural traditions</li>
                  <li>Common terms and their meanings</li>
                </ul>
              </div>
              <button className="w-full py-3 bg-highlight text-white rounded-xl font-bold hover:bg-highlight/90 transition-colors flex items-center justify-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Enroll in Course
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Cultural Context Guide</h4>
            <div className="bg-muted/40 rounded-xl p-6 border border-border/50 space-y-4">
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">Respect and Reverence</h5>
                <p className="text-sm text-muted-foreground">
                  Ifá and Isese are sacred traditions with deep cultural and spiritual significance.
                  Approach with respect, openness, and a willingness to learn.
                </p>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">What Makes This Different</h5>
                <p className="text-sm text-muted-foreground">
                  Unlike casual consultations, Ifá divination is a spiritual practice that connects you
                  with ancestral wisdom. The guidance you receive is not just advice—it's a sacred
                  message from the Odù.
                </p>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">Your Role as a Seeker</h5>
                <p className="text-sm text-muted-foreground">
                  As a client (Mọyọ̀), you are on a journey of spiritual growth. Be patient, ask
                  questions respectfully, and honor the guidance you receive.
                </p>
              </div>
              <div className="space-y-3">
                <h5 className="font-bold text-foreground">Building Relationships</h5>
                <p className="text-sm text-muted-foreground">
                  The relationship with your Personal Awo is sacred and long-term. It's built on
                  trust, respect, and mutual commitment to your spiritual growth.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full py-4 bg-background text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2"
      >
        Continue to Setup
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CulturalOnboardingPath;
