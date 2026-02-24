import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Daily Yoruba Word Service
 * Provides a daily Yoruba word with pronunciation, definition, and cultural context
 * Tracks word history and ensures consistency across users
 */
@Injectable()
export class YorubaWordService {
  private readonly logger = new Logger(YorubaWordService.name);

  // Collection of Yoruba words with cultural significance
  private readonly yorubaWords = [
    {
      word: 'Àṣẹ',
      pronunciation: 'Ah-sheh',
      definition: 'The power to make things happen; spiritual authority, command, and life force.',
      example: 'May your words carry Àṣẹ.',
      culturalContext:
        'Àṣẹ is the foundational concept in Yoruba spirituality, representing the divine authority to create and transform reality.',
      category: 'Spiritual',
    },
    {
      word: 'Ìwà Pẹ̀lẹ́',
      pronunciation: 'Ee-wah Peh-leh',
      definition:
        'Good character; the ethical foundation of Yoruba philosophy, emphasizing humility, respect, and moral conduct.',
      example: 'Cultivating Ìwà Pẹ̀lẹ́ is essential for spiritual growth.',
      culturalContext:
        'Ìwà Pẹ̀lẹ́ is considered the cornerstone of Yoruba ethics, teaching that character is more valuable than wealth or status.',
      category: 'Ethics',
    },
    {
      word: 'Orí',
      pronunciation: 'Oh-ree',
      definition:
        "Head, destiny, or personal spiritual guardian. Represents one's chosen path and spiritual essence.",
      example: 'Your Orí guides your journey in life.',
      culturalContext:
        "Orí is believed to be chosen before birth and represents one's destiny and spiritual identity.",
      category: 'Spiritual',
    },
    {
      word: 'Ẹbọ',
      pronunciation: 'Eh-boh',
      definition:
        'Sacrifice or offering; a ritual act performed to appease Oríṣà, resolve problems, or bring about desired outcomes.',
      example: 'The Babaláwo prescribed an Ẹbọ for protection.',
      culturalContext:
        'Ẹbọ is a sacred practice of giving back to the spiritual forces, maintaining balance and harmony.',
      category: 'Ritual',
    },
    {
      word: 'Odù',
      pronunciation: 'Oh-doo',
      definition:
        'The sacred texts and literary corpus of Ifá, comprising 256 principal chapters, each with verses, stories, and prescriptions.',
      example: 'The Odù revealed the path forward.',
      culturalContext:
        'Odù Ifá is the complete body of Ifá knowledge, containing wisdom, history, and guidance for all aspects of life.',
      category: 'Knowledge',
    },
    {
      word: 'Ilé Ifá',
      pronunciation: 'Ee-leh Ee-fah',
      definition:
        'House of Ifá; a traditional Ifá temple or compound, serving as a center for worship, learning, and community.',
      example: 'The community gathered at the Ilé Ifá.',
      culturalContext:
        'Ilé Ifá is both a physical and spiritual space where Ifá practitioners gather for ceremonies, learning, and community support.',
      category: 'Place',
    },
    {
      word: 'Babaláwo',
      pronunciation: 'Bah-bah-LAH-woh',
      definition:
        'Father of Secrets; a high priest of Ifá, trained in divination and spiritual guidance.',
      example: 'Consulting a Babaláwo for guidance.',
      culturalContext:
        'Babaláwo are the custodians of Ifá knowledge, trained through years of study and initiation to serve their communities.',
      category: 'Role',
    },
    {
      word: 'Oríṣà',
      pronunciation: 'Oh-REE-shah',
      definition:
        'Deities or divinities of the Yoruba spiritual tradition, representing various forces of nature and aspects of human experience.',
      example: 'Sango is the Oríṣà of thunder and lightning.',
      culturalContext:
        'Oríṣà are the divine forces that govern different aspects of life, nature, and human experience in Yoruba cosmology.',
      category: 'Spiritual',
    },
    {
      word: 'Akọ́ṣe',
      pronunciation: 'Ah-KOH-sheh',
      definition:
        'Spiritual work or charm; a prepared item or ritual designed to achieve a specific spiritual purpose, often based on divination.',
      example: 'An Akọ́ṣe was prepared for protection.',
      culturalContext:
        'Akọ́ṣe are sacred objects or rituals created through divination to address specific spiritual needs or challenges.',
      category: 'Ritual',
    },
    {
      word: 'Ìyá',
      pronunciation: 'Ee-yah',
      definition:
        'Mother; also refers to female spiritual entities and the nurturing, protective aspect of the divine feminine.',
      example: 'We honor Ìyá, the source of all life.',
      culturalContext:
        'Ìyá represents the maternal principle in Yoruba cosmology, embodying creation, protection, and transformation.',
      category: 'Spiritual',
    },
    {
      word: 'Ọmọ',
      pronunciation: 'Oh-moh',
      definition: 'Child; also refers to initiates or devotees of an Oríṣà or spiritual tradition.',
      example: 'As Ọmọ of Ifá, I follow the teachings of my lineage.',
      culturalContext:
        'Ọmọ denotes both biological and spiritual relationships, emphasizing the interconnectedness of family and spiritual community.',
      category: 'Relationship',
    },
    {
      word: 'Ìtàn',
      pronunciation: 'Ee-tahn',
      definition:
        'History, story, or narrative; the oral tradition that preserves cultural knowledge, wisdom, and heritage.',
      example: "The Ìtàn tells of our ancestors' journey.",
      culturalContext:
        'Ìtàn is the living memory of the Yoruba people, passed down through generations to preserve cultural identity and wisdom.',
      category: 'Knowledge',
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Get today's Yoruba word
   * Uses database to ensure consistency - same word for all users on the same day
   * Creates word entry if it doesn't exist for today
   */
  async getDailyWord(userId?: string): Promise<{
    id: string;
    word: string;
    pronunciation: string;
    definition: string;
    example: string;
    culturalContext: string;
    category: string;
    date: string;
    viewCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Check if word exists for today
    let dailyWord = await this.prisma.dailyYorubaWord.findUnique({
      where: { date: today },
    });

    // If no word for today, create one using day-of-year algorithm
    if (!dailyWord) {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const dayOfYear = Math.floor(
        (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
      );
      const wordIndex = dayOfYear % this.yorubaWords.length;
      const selectedWord = this.yorubaWords[wordIndex];

      dailyWord = await this.prisma.dailyYorubaWord.create({
        data: {
          word: selectedWord.word,
          pronunciation: selectedWord.pronunciation,
          definition: selectedWord.definition,
          example: selectedWord.example,
          culturalContext: selectedWord.culturalContext,
          category: selectedWord.category,
          date: today,
          viewCount: 0,
        },
      });
    }

    // Track user view if userId provided
    if (userId) {
      await this.trackUserView(userId, dailyWord.id);
    }

    // Increment view count
    dailyWord = await this.prisma.dailyYorubaWord.update({
      where: { id: dailyWord.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      id: dailyWord.id,
      word: dailyWord.word,
      pronunciation: dailyWord.pronunciation,
      definition: dailyWord.definition,
      example: dailyWord.example,
      culturalContext: dailyWord.culturalContext,
      category: dailyWord.category,
      date: dailyWord.date.toISOString(),
      viewCount: dailyWord.viewCount,
    };
  }

  /**
   * Get random Yoruba word (for variety)
   */
  async getRandomWord(): Promise<{
    word: string;
    pronunciation: string;
    definition: string;
    example: string;
    culturalContext: string;
    category: string;
  }> {
    const randomIndex = Math.floor(Math.random() * this.yorubaWords.length);
    return this.yorubaWords[randomIndex];
  }

  /**
   * Get word by ID
   */
  async getWordById(wordId: string): Promise<{
    id: string;
    word: string;
    pronunciation: string;
    definition: string;
    example: string;
    culturalContext: string;
    category: string;
    date: string;
    viewCount: number;
  } | null> {
    const word = await this.prisma.dailyYorubaWord.findUnique({
      where: { id: wordId },
    });

    if (!word) return null;

    return {
      id: word.id,
      word: word.word,
      pronunciation: word.pronunciation,
      definition: word.definition,
      example: word.example,
      culturalContext: word.culturalContext,
      category: word.category,
      date: word.date.toISOString(),
      viewCount: word.viewCount,
    };
  }

  /**
   * Get word history for a user
   */
  async getUserWordHistory(userId: string, limit: number = 30) {
    const history = await this.prisma.userWordHistory.findMany({
      where: { userId },
      include: {
        word: true,
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    return history.map((entry) => ({
      id: entry.word.id,
      word: entry.word.word,
      pronunciation: entry.word.pronunciation,
      definition: entry.word.definition,
      example: entry.word.example,
      culturalContext: entry.word.culturalContext,
      category: entry.word.category,
      date: entry.word.date.toISOString(),
      viewedAt: entry.viewedAt.toISOString(),
    }));
  }

  /**
   * Get words by category
   */
  async getWordsByCategory(category: string): Promise<
    Array<{
      word: string;
      pronunciation: string;
      definition: string;
      example: string;
      culturalContext: string;
      category: string;
    }>
  > {
    return this.yorubaWords.filter((w) => w.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(new Set(this.yorubaWords.map((w) => w.category)));
  }

  /**
   * Track user view of a word
   */
  private async trackUserView(userId: string, wordId: string): Promise<void> {
    try {
      await this.prisma.userWordHistory.upsert({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        create: {
          userId,
          wordId,
        },
        update: {
          viewedAt: new Date(),
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.warn(`Failed to track word view for user ${userId}: ${err.message}`);
    }
  }
}
