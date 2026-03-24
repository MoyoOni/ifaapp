export interface ForumTemplate {
  id: string;
  name: string;
  titlePrefix: string;
  body: string;
}

export interface CategoryTemplates {
  categorySlug: string;
  templates: ForumTemplate[];
}

export const FORUM_TEMPLATES: CategoryTemplates[] = [
  {
    categorySlug: 'ifa-divination-studies',
    templates: [
      {
        id: 'ask-odu',
        name: 'Ask About an Odù',
        titlePrefix: 'Question about Odù',
        body: `Odù name: [e.g. Ogbe Meji, Oyeku Ofun]

My question:
[What specifically would you like to understand about this Odù?]

Context:
[What led you to this question? What have you studied or been taught so far?]

Source / who taught this:
[Elder, text, or tradition — if known. If unsure, that's okay.]`,
      },
      {
        id: 'share-dream',
        name: 'Share a Dream for Interpretation',
        titlePrefix: 'Dream interpretation help:',
        body: `Date of dream: [e.g. 22 March 2026]

Dream description:
[Describe everything you remember — symbols, people, places, actions]

Feelings during the dream:
[Peaceful, fearful, confused, joyful?]

Current life context:
[What significant things are happening in your life right now?]

Have you consulted an elder or Babalawo yet?
[Yes / No / Planning to]`,
      },
    ],
  },
  {
    categorySlug: 'idagbasile-ilana',
    templates: [
      {
        id: 'introduce-yourself',
        name: 'Introduce Yourself',
        titlePrefix: 'Introduction:',
        body: `Who I am:
[Your name, Yoruba name if you have one, where you're based]

How I found Ifá / Isese:
[Your journey — family tradition, personal discovery, recommendation?]

Where I am in my path:
[Just beginning / Studying / Initiated / Practitioner]

What I'm seeking from this community:
[Knowledge, community, guidance, connection?]

Something I'm curious about right now:
[Any question or topic you'd love to explore here]`,
      },
    ],
  },
  {
    categorySlug: 'temple-connections-events',
    templates: [
      {
        id: 'event-announcement',
        name: 'Event Announcement',
        titlePrefix: 'Event:',
        body: `Event name: [Full title of the event]

Date & Time: [Day, date, time — include timezone]

Location:
Physical: [Address or city] / Virtual: [Platform + link]

Description:
[What will happen? Who is it for? What will attendees gain?]

Hosted by: [Name, temple, or organisation]

Registration: [Link or contact — or "open/free attendance"]

Cost: [Free / Donation requested / Ticketed — include amount]`,
      },
    ],
  },
  {
    categorySlug: 'resources-recommendations',
    templates: [
      {
        id: 'resource-recommendation',
        name: 'Recommend a Resource',
        titlePrefix: 'Recommendation:',
        body: `What I'm recommending:
[Book title, app name, website, vendor, teacher, etc.]

Why I recommend it:
[What made it valuable to you? What did you learn or gain?]

Best for:
[Beginners / Intermediate students / Practitioners / Yoruba language learners / etc.]

Where to find it:
[Link, publisher, location — where can others access this?]

Any caveats:
[Anything to be aware of — cost, viewpoint, availability?]`,
      },
    ],
  },
  {
    categorySlug: 'seeker-questions',
    templates: [
      {
        id: 'seeker-question',
        name: 'Ask a Question',
        titlePrefix: 'Question:',
        body: `My question:
[Ask anything — there are no foolish questions here]

Background:
[What brought you to this question? Any context that helps?]

What I've already tried to find out:
[Have you searched, asked someone, or read about it?]

*This is a judgment-free space. You may post anonymously if you prefer.*`,
      },
    ],
  },
];

export function getTemplatesForCategory(slug: string): ForumTemplate[] {
  return FORUM_TEMPLATES.find((ct) => ct.categorySlug === slug)?.templates ?? [];
}
