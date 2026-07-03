/**
 * The complete corpus of 256 Odu Ifa.
 *
 * The first 16 are the Oju Odu (principal/Meji Odu) in traditional
 * hierarchical order. The remaining 240 are the Omo Odu (minor Odu),
 * formed by combining each principal Odu on the right leg with every
 * other principal Odu on the left leg.
 *
 * Ordering follows the traditional Oyo/Ile-Ife sequence used by most
 * lineages of Babalawo practice.
 */

export interface Odu {
  /** Authentic Yoruba name of the Odu */
  name: string;
  /** One-sentence spiritual meaning suitable for daily guidance */
  meaning: string;
  /** Two-to-four word thematic summary */
  theme: string;
}

export const ODU_CORPUS: Odu[] = [
  // ═══════════════════════════════════════════════════════════════
  // OJU ODU — The 16 Principal (Meji) Odu
  // ═══════════════════════════════════════════════════════════════

  // 1
  {
    name: 'Eji Ogbe',
    meaning: 'The doorway of pure light opens; clarity of purpose illuminates every path forward.',
    theme: 'Divine clarity',
  },
  // 2
  {
    name: 'Oyeku Meji',
    meaning: 'In the stillness of midnight the ancestors speak; endings carry the seed of new beginnings.',
    theme: 'Ancestral wisdom',
  },
  // 3
  {
    name: 'Iwori Meji',
    meaning: 'Inner vision reveals what the outer eyes cannot see; trust the wisdom that arises from within.',
    theme: 'Inner vision',
  },
  // 4
  {
    name: 'Odi Meji',
    meaning: 'The womb of creation holds all potential; feminine power nurtures what is yet to be born.',
    theme: 'Creative gestation',
  },
  // 5
  {
    name: 'Irosun Meji',
    meaning: 'The bloodline of tradition flows strong; honor the covenant between the living and the divine.',
    theme: 'Sacred covenant',
  },
  // 6
  {
    name: 'Owonrin Meji',
    meaning: 'Sudden change overturns the expected; chaos is the messenger of necessary transformation.',
    theme: 'Transformative change',
  },
  // 7
  {
    name: 'Obara Meji',
    meaning: 'The power of speech shapes reality; speak with conviction and the universe arranges itself accordingly.',
    theme: 'Power of speech',
  },
  // 8
  {
    name: 'Okanran Meji',
    meaning: 'The heart must be aligned with action; sincerity of intention draws blessings from Olodumare.',
    theme: 'Heart alignment',
  },
  // 9
  {
    name: 'Ogunda Meji',
    meaning: 'Ogun clears the path with iron resolve; obstacles yield before disciplined effort and courage.',
    theme: 'Courageous resolve',
  },
  // 10
  {
    name: 'Osa Meji',
    meaning: 'The winds of change blow from the unseen realm; adaptability ensures survival and growth.',
    theme: 'Spiritual adaptability',
  },
  // 11
  {
    name: 'Ika Meji',
    meaning: 'Wisdom lies in knowing when to act and when to wait; patience disarms even the strongest adversary.',
    theme: 'Strategic patience',
  },
  // 12
  {
    name: 'Oturupon Meji',
    meaning: 'Illness of body or spirit calls for cleansing; healing begins when the source of imbalance is acknowledged.',
    theme: 'Healing and cleansing',
  },
  // 13
  {
    name: 'Otura Meji',
    meaning: 'The divine communicates through signs and wonders; cultivate sensitivity to the messages of Ifa.',
    theme: 'Divine communication',
  },
  // 14
  {
    name: 'Irete Meji',
    meaning: 'Firm determination presses forward against all odds; perseverance is the footprint of destiny fulfilled.',
    theme: 'Steadfast determination',
  },
  // 15
  {
    name: 'Ose Meji',
    meaning: 'Abundance flows from the waters of Osun; generosity and gratitude multiply every blessing received.',
    theme: 'Flowing abundance',
  },
  // 16
  {
    name: 'Ofun Meji',
    meaning: 'The white cloth of purity covers the devotee; spiritual refinement brings one closer to the Source.',
    theme: 'Spiritual purity',
  },

  // ═══════════════════════════════════════════════════════════════
  // OMO ODU — The 240 Combination Odu
  // Right leg (first named) x Left leg (second named)
  // ═══════════════════════════════════════════════════════════════

  // ── Ogbe combinations (right leg: Ogbe) ──────────────────────
  // 17
  {
    name: 'Ogbe Oyeku',
    meaning: 'Light meets the mystery of night; faith bridges the known and the unknown.',
    theme: 'Faith in mystery',
  },
  // 18
  {
    name: 'Ogbe Iwori',
    meaning: 'Clear purpose illuminates hidden truths; look beneath the surface for the real answer.',
    theme: 'Revealed truth',
  },
  // 19
  {
    name: 'Ogbe Odi',
    meaning: 'Open roads lead to fertile ground; new ventures are blessed when begun with honesty.',
    theme: 'Fertile beginnings',
  },
  // 20
  {
    name: 'Ogbe Irosun',
    meaning: 'The light of today honors the blood of yesterday; ancestral blessings pave the way forward.',
    theme: 'Ancestral blessing',
  },
  // 21
  {
    name: 'Ogbe Owonrin',
    meaning: 'Sudden opportunity arrives in the brightness of day; seize the moment with both hands.',
    theme: 'Seizing opportunity',
  },
  // 22
  {
    name: 'Ogbe Obara',
    meaning: 'A clear voice carries authority; speak your truth with confidence and doors will open.',
    theme: 'Confident expression',
  },
  // 23
  {
    name: 'Ogbe Okanran',
    meaning: 'When the mind is clear and the heart is true, right action follows naturally.',
    theme: 'Mind-heart unity',
  },
  // 24
  {
    name: 'Ogbe Ogunda',
    meaning: 'Light guides the warrior; righteous effort opens even the most stubborn blockage.',
    theme: 'Righteous effort',
  },
  // 25
  {
    name: 'Ogbe Osa',
    meaning: 'Clarity prevails over confusion; stand firm in your principles when winds of change blow.',
    theme: 'Principled clarity',
  },
  // 26
  {
    name: 'Ogbe Ika',
    meaning: 'Transparent intentions neutralize hidden threats; lead with openness and integrity.',
    theme: 'Transparent integrity',
  },
  // 27
  {
    name: 'Ogbe Oturupon',
    meaning: 'The light of awareness heals what darkness conceals; acknowledge imbalance to restore health.',
    theme: 'Healing awareness',
  },
  // 28
  {
    name: 'Ogbe Otura',
    meaning: 'Divine messages arrive with striking clarity; pay attention to signs presented in plain sight.',
    theme: 'Clear signs',
  },
  // 29
  {
    name: 'Ogbe Irete',
    meaning: 'Purposeful vision meets unwavering will; success belongs to those who plan and persist.',
    theme: 'Visionary persistence',
  },
  // 30
  {
    name: 'Ogbe Ose',
    meaning: 'Bright blessings pour like a river in sunlight; gratitude amplifies the flow of goodness.',
    theme: 'Grateful abundance',
  },
  // 31
  {
    name: 'Ogbe Ofun',
    meaning: 'Pure intention meets clear understanding; simplicity of heart attracts divine favor.',
    theme: 'Pure intention',
  },

  // ── Oyeku combinations (right leg: Oyeku) ────────────────────
  // 32
  {
    name: 'Oyeku Ogbe',
    meaning: 'From the depth of night a new dawn emerges; trust the process of renewal even in darkness.',
    theme: 'Dawn from darkness',
  },
  // 33
  {
    name: 'Oyeku Iwori',
    meaning: 'Hidden knowledge surfaces from the realm of the ancestors; dreams carry important messages.',
    theme: 'Ancestral messages',
  },
  // 34
  {
    name: 'Oyeku Odi',
    meaning: 'The ancestors guard the womb of destiny; protection surrounds those who honor their lineage.',
    theme: 'Ancestral protection',
  },
  // 35
  {
    name: 'Oyeku Irosun',
    meaning: 'The covenant with the departed must be renewed; feed the roots so the tree may flourish.',
    theme: 'Renewing covenants',
  },
  // 36
  {
    name: 'Oyeku Owonrin',
    meaning: 'Unexpected revelations come from the spirit world; be prepared for a shift in understanding.',
    theme: 'Spirit revelations',
  },
  // 37
  {
    name: 'Oyeku Obara',
    meaning: 'The voice of the ancestors echoes through the living; speak the words they place on your tongue.',
    theme: 'Ancestral voice',
  },
  // 38
  {
    name: 'Oyeku Okanran',
    meaning: 'A sincere heart finds peace even in mourning; emotional truth heals grief.',
    theme: 'Healing grief',
  },
  // 39
  {
    name: 'Oyeku Ogunda',
    meaning: 'The warrior rests before the next battle; conserve strength through spiritual retreat.',
    theme: 'Sacred rest',
  },
  // 40
  {
    name: 'Oyeku Osa',
    meaning: 'The unseen wind carries the scent of destiny; surrender control and trust higher guidance.',
    theme: 'Surrender to guidance',
  },
  // 41
  {
    name: 'Oyeku Ika',
    meaning: 'Patience in the dark season prevents rash mistakes; wait for the right moment to act.',
    theme: 'Patient waiting',
  },
  // 42
  {
    name: 'Oyeku Oturupon',
    meaning: 'Deep cleansing of the spirit is required; release old sorrows to make room for renewal.',
    theme: 'Deep release',
  },
  // 43
  {
    name: 'Oyeku Otura',
    meaning: 'Prophecy emerges from the silence of the night; the divine speaks when the world is quiet.',
    theme: 'Silent prophecy',
  },
  // 44
  {
    name: 'Oyeku Irete',
    meaning: 'Determination endures beyond earthly transitions; legacy is built by those who persist.',
    theme: 'Enduring legacy',
  },
  // 45
  {
    name: 'Oyeku Ose',
    meaning: 'Hidden wealth is revealed in due time; blessings stored in the unseen realm manifest patiently.',
    theme: 'Hidden blessings',
  },
  // 46
  {
    name: 'Oyeku Ofun',
    meaning: 'Purification comes through the passage of endings; let go of the old to embrace the sacred.',
    theme: 'Sacred release',
  },

  // ── Iwori combinations (right leg: Iwori) ────────────────────
  // 47
  {
    name: 'Iwori Ogbe',
    meaning: 'Inner sight is confirmed by outward evidence; what you sense intuitively will be validated.',
    theme: 'Validated intuition',
  },
  // 48
  {
    name: 'Iwori Oyeku',
    meaning: 'The third eye peers into the ancestral realm; visions bring understanding of past patterns.',
    theme: 'Ancestral insight',
  },
  // 49
  {
    name: 'Iwori Odi',
    meaning: 'Deep reflection reveals the origin of creative blocks; self-knowledge unlocks productivity.',
    theme: 'Creative unblocking',
  },
  // 50
  {
    name: 'Iwori Irosun',
    meaning: 'Intuition honors the traditions of the elders; inner knowing and ancestral wisdom align.',
    theme: 'Intuitive tradition',
  },
  // 51
  {
    name: 'Iwori Owonrin',
    meaning: 'A flash of insight disrupts old assumptions; embrace the unexpected truth that emerges.',
    theme: 'Disruptive insight',
  },
  // 52
  {
    name: 'Iwori Obara',
    meaning: 'Inner wisdom finds its voice; articulate the vision you see so others may follow.',
    theme: 'Articulated vision',
  },
  // 53
  {
    name: 'Iwori Okanran',
    meaning: 'The heart sees what the mind questions; trust emotional intelligence over mere logic.',
    theme: 'Emotional intelligence',
  },
  // 54
  {
    name: 'Iwori Ogunda',
    meaning: 'Insight sharpens the blade of action; know your target before you strike.',
    theme: 'Focused action',
  },
  // 55
  {
    name: 'Iwori Osa',
    meaning: 'Intuition warns of shifting conditions; heed your inner compass when the terrain changes.',
    theme: 'Intuitive warning',
  },
  // 56
  {
    name: 'Iwori Ika',
    meaning: 'The wise observer sees through deception; discernment protects against hidden dangers.',
    theme: 'Sharp discernment',
  },
  // 57
  {
    name: 'Iwori Oturupon',
    meaning: 'Insight into the root cause of ailment leads to lasting cure; diagnose before you treat.',
    theme: 'Root cause healing',
  },
  // 58
  {
    name: 'Iwori Otura',
    meaning: 'Two channels of prophecy converge; the message is confirmed from multiple spiritual sources.',
    theme: 'Confirmed prophecy',
  },
  // 59
  {
    name: 'Iwori Irete',
    meaning: 'Persistent inner vision drives outer achievement; keep the goal clearly in your mind.',
    theme: 'Visionary drive',
  },
  // 60
  {
    name: 'Iwori Ose',
    meaning: 'Intuition guides you toward abundance; follow your inner sense of where blessings flow.',
    theme: 'Intuitive prosperity',
  },
  // 61
  {
    name: 'Iwori Ofun',
    meaning: 'Clarity of inner sight brings spiritual refinement; see yourself as Olodumare sees you.',
    theme: 'Refined perception',
  },

  // ── Odi combinations (right leg: Odi) ────────────────────────
  // 62
  {
    name: 'Odi Ogbe',
    meaning: 'The creative womb opens to the light; a new chapter begins with abundant potential.',
    theme: 'New potential',
  },
  // 63
  {
    name: 'Odi Oyeku',
    meaning: 'The mystery of birth and death intertwine; honor transitions as sacred thresholds.',
    theme: 'Sacred transitions',
  },
  // 64
  {
    name: 'Odi Iwori',
    meaning: 'Deep feminine wisdom reveals hidden patterns; nurture what you discover within.',
    theme: 'Feminine wisdom',
  },
  // 65
  {
    name: 'Odi Irosun',
    meaning: 'The bloodline carries creative gifts; talents passed through generations now seek expression.',
    theme: 'Inherited gifts',
  },
  // 66
  {
    name: 'Odi Owonrin',
    meaning: 'Unexpected fertility surprises the doubter; what seemed barren suddenly produces fruit.',
    theme: 'Unexpected fruition',
  },
  // 67
  {
    name: 'Odi Obara',
    meaning: 'Creative power finds its voice in declaration; speak life into your projects and plans.',
    theme: 'Creative declaration',
  },
  // 68
  {
    name: 'Odi Okanran',
    meaning: 'The heart protects what it has conceived; guard your ideas until they are ready to emerge.',
    theme: 'Guarding ideas',
  },
  // 69
  {
    name: 'Odi Ogunda',
    meaning: 'Protective barriers must sometimes be cut through; discern when walls help and when they hinder.',
    theme: 'Discerning boundaries',
  },
  // 70
  {
    name: 'Odi Osa',
    meaning: 'The nurturing space must adapt to changing needs; flexibility in care strengthens relationships.',
    theme: 'Flexible nurturing',
  },
  // 71
  {
    name: 'Odi Ika',
    meaning: 'Protective instincts serve well when tempered with wisdom; guard without suffocating.',
    theme: 'Wise protection',
  },
  // 72
  {
    name: 'Odi Oturupon',
    meaning: 'The womb must be cleansed before new life can grow; release toxins from your creative space.',
    theme: 'Creative cleansing',
  },
  // 73
  {
    name: 'Odi Otura',
    meaning: 'Prophecy gestates in the quiet spaces; revelations come after a period of patient incubation.',
    theme: 'Incubating revelation',
  },
  // 74
  {
    name: 'Odi Irete',
    meaning: 'Determination protects what is growing within; persist in nurturing your emerging purpose.',
    theme: 'Nurturing persistence',
  },
  // 75
  {
    name: 'Odi Ose',
    meaning: 'The waters of abundance nourish the creative womb; prosperity supports new creation.',
    theme: 'Nourished creation',
  },
  // 76
  {
    name: 'Odi Ofun',
    meaning: 'Purity of intention in creation attracts divine support; create from a place of sincerity.',
    theme: 'Sincere creation',
  },

  // ── Irosun combinations (right leg: Irosun) ─────────────────
  // 77
  {
    name: 'Irosun Ogbe',
    meaning: 'The covenant is renewed in the light of a new day; honor your promises and blessings follow.',
    theme: 'Renewed covenant',
  },
  // 78
  {
    name: 'Irosun Oyeku',
    meaning: 'The ancestors demand remembrance; pour libation and speak their names to maintain the bond.',
    theme: 'Ancestral remembrance',
  },
  // 79
  {
    name: 'Irosun Iwori',
    meaning: 'Traditional wisdom gains depth through personal insight; experience confirms what elders taught.',
    theme: 'Experiential wisdom',
  },
  // 80
  {
    name: 'Irosun Odi',
    meaning: 'The sacred bloodline nurtures new growth; family traditions support creative endeavors.',
    theme: 'Family support',
  },
  // 81
  {
    name: 'Irosun Owonrin',
    meaning: 'Ancient traditions adapt to sudden change; the covenant endures even when forms shift.',
    theme: 'Adaptive tradition',
  },
  // 82
  {
    name: 'Irosun Obara',
    meaning: 'The voice of tradition carries weight; speak from the authority of your lineage.',
    theme: 'Lineage authority',
  },
  // 83
  {
    name: 'Irosun Okanran',
    meaning: 'Heartfelt devotion strengthens the ancestral bond; sincerity in worship brings reciprocal blessings.',
    theme: 'Heartfelt devotion',
  },
  // 84
  {
    name: 'Irosun Ogunda',
    meaning: 'The covenant requires active defense; protect sacred traditions from erosion.',
    theme: 'Defending tradition',
  },
  // 85
  {
    name: 'Irosun Osa',
    meaning: 'Spiritual winds carry the fragrance of ancient rites; adapt ceremony while preserving essence.',
    theme: 'Preserved essence',
  },
  // 86
  {
    name: 'Irosun Ika',
    meaning: 'Patience preserves the covenant through difficult seasons; endurance honors your word.',
    theme: 'Covenant endurance',
  },
  // 87
  {
    name: 'Irosun Oturupon',
    meaning: 'Cleansing rituals restore the power of the bloodline; heal generational wounds through ceremony.',
    theme: 'Generational healing',
  },
  // 88
  {
    name: 'Irosun Otura',
    meaning: 'Prophecy flows through the sacred lineage; the gift of divination passes from elder to initiate.',
    theme: 'Prophetic lineage',
  },
  // 89
  {
    name: 'Irosun Irete',
    meaning: 'Determined adherence to tradition builds lasting legacy; consistency in practice yields mastery.',
    theme: 'Disciplined practice',
  },
  // 90
  {
    name: 'Irosun Ose',
    meaning: 'Abundance flows through the channels of tradition; cultural wealth enriches all who partake.',
    theme: 'Cultural wealth',
  },
  // 91
  {
    name: 'Irosun Ofun',
    meaning: 'The purity of traditional practice elevates the practitioner; sacred knowledge demands sacred conduct.',
    theme: 'Sacred conduct',
  },

  // ── Owonrin combinations (right leg: Owonrin) ────────────────
  // 92
  {
    name: 'Owonrin Ogbe',
    meaning: 'Sudden change reveals new clarity; disruption opens a door you did not know existed.',
    theme: 'Clarifying disruption',
  },
  // 93
  {
    name: 'Owonrin Oyeku',
    meaning: 'Transformation touches the realm of ancestors; old patterns dissolve to make way for new ones.',
    theme: 'Pattern dissolution',
  },
  // 94
  {
    name: 'Owonrin Iwori',
    meaning: 'A sudden flash of insight changes everything; act quickly on the revelation before it fades.',
    theme: 'Sudden revelation',
  },
  // 95
  {
    name: 'Owonrin Odi',
    meaning: 'Creative chaos births new forms; embrace disorder as the raw material of innovation.',
    theme: 'Creative chaos',
  },
  // 96
  {
    name: 'Owonrin Irosun',
    meaning: 'Change disrupts tradition yet renews its relevance; adapt ancestral wisdom to current needs.',
    theme: 'Renewed relevance',
  },
  // 97
  {
    name: 'Owonrin Obara',
    meaning: 'Words spoken in the heat of change carry great power; be mindful of what you declare during transitions.',
    theme: 'Transformative speech',
  },
  // 98
  {
    name: 'Owonrin Okanran',
    meaning: 'The heart is shaken awake by unexpected events; emotional honesty emerges through upheaval.',
    theme: 'Awakened heart',
  },
  // 99
  {
    name: 'Owonrin Ogunda',
    meaning: 'The path is cleared by an unexpected force; sudden removal of obstacles signals divine intervention.',
    theme: 'Divine intervention',
  },
  // 100
  {
    name: 'Owonrin Osa',
    meaning: 'Two winds collide and create a powerful storm; the aftermath brings renewed freshness.',
    theme: 'Renewing storm',
  },
  // 101
  {
    name: 'Owonrin Ika',
    meaning: 'Patience is tested by sudden upheaval; maintain strategic composure amid chaos.',
    theme: 'Composure in chaos',
  },
  // 102
  {
    name: 'Owonrin Oturupon',
    meaning: 'A sudden crisis exposes hidden illness; the shock of truth initiates deep healing.',
    theme: 'Crisis healing',
  },
  // 103
  {
    name: 'Owonrin Otura',
    meaning: 'An unexpected prophecy disrupts complacency; heed the warning that arrives without invitation.',
    theme: 'Unexpected prophecy',
  },
  // 104
  {
    name: 'Owonrin Irete',
    meaning: 'Persistence through turbulent change leads to breakthrough; hold your course through the storm.',
    theme: 'Breakthrough perseverance',
  },
  // 105
  {
    name: 'Owonrin Ose',
    meaning: 'Sudden abundance arrives like a flash flood; be prepared to channel unexpected blessings wisely.',
    theme: 'Sudden abundance',
  },
  // 106
  {
    name: 'Owonrin Ofun',
    meaning: 'Transformation purifies the spirit; what is burned away reveals the gold beneath.',
    theme: 'Purifying transformation',
  },

  // ── Obara combinations (right leg: Obara) ────────────────────
  // 107
  {
    name: 'Obara Ogbe',
    meaning: 'A powerful declaration meets the light of truth; speak boldly and the universe confirms.',
    theme: 'Bold declaration',
  },
  // 108
  {
    name: 'Obara Oyeku',
    meaning: 'The spoken word reaches the ancestors; prayers uttered aloud penetrate the unseen realm.',
    theme: 'Prayers received',
  },
  // 109
  {
    name: 'Obara Iwori',
    meaning: 'Words shaped by inner wisdom carry deep conviction; let intuition guide your speech.',
    theme: 'Intuitive speech',
  },
  // 110
  {
    name: 'Obara Odi',
    meaning: 'Creative expression brings forth what was hidden; art and speech reveal inner truths.',
    theme: 'Expressive revelation',
  },
  // 111
  {
    name: 'Obara Irosun',
    meaning: 'The voice of tradition commands respect; speak with the authority of those who came before.',
    theme: 'Traditional authority',
  },
  // 112
  {
    name: 'Obara Owonrin',
    meaning: 'A sudden proclamation changes the course of events; words spoken in crisis carry lasting impact.',
    theme: 'Impactful proclamation',
  },
  // 113
  {
    name: 'Obara Okanran',
    meaning: 'Speaking from the heart builds unshakable trust; authentic expression creates deep bonds.',
    theme: 'Authentic expression',
  },
  // 114
  {
    name: 'Obara Ogunda',
    meaning: 'Commanding words direct decisive action; the leader speaks and the path is cleared.',
    theme: 'Commanding leadership',
  },
  // 115
  {
    name: 'Obara Osa',
    meaning: 'The voice adapts its message to shifting circumstances; eloquence lies in timely words.',
    theme: 'Timely eloquence',
  },
  // 116
  {
    name: 'Obara Ika',
    meaning: 'Measured speech prevents conflict; wise words spoken at the right time avoid unnecessary strife.',
    theme: 'Measured words',
  },
  // 117
  {
    name: 'Obara Oturupon',
    meaning: 'Healing words soothe the suffering spirit; speak comfort to those in pain.',
    theme: 'Healing words',
  },
  // 118
  {
    name: 'Obara Otura',
    meaning: 'Prophetic utterance flows through the speaker; divine words emerge when the vessel is prepared.',
    theme: 'Prophetic utterance',
  },
  // 119
  {
    name: 'Obara Irete',
    meaning: 'Persistent affirmation shapes destiny; repeat your purpose until reality conforms.',
    theme: 'Affirmed destiny',
  },
  // 120
  {
    name: 'Obara Ose',
    meaning: 'Words of blessing multiply abundance; speak prosperity over your endeavors.',
    theme: 'Spoken blessing',
  },
  // 121
  {
    name: 'Obara Ofun',
    meaning: 'Pure speech elevates the community; words free of malice build sacred spaces.',
    theme: 'Elevated speech',
  },

  // ── Okanran combinations (right leg: Okanran) ────────────────
  // 122
  {
    name: 'Okanran Ogbe',
    meaning: 'The heart opens to the light of understanding; emotional clarity guides wise decisions.',
    theme: 'Emotional clarity',
  },
  // 123
  {
    name: 'Okanran Oyeku',
    meaning: 'The heart mourns what has passed; allow grief its natural rhythm and healing follows.',
    theme: 'Honored grief',
  },
  // 124
  {
    name: 'Okanran Iwori',
    meaning: 'Deep feelings reveal deep truths; emotional honesty unlocks genuine insight.',
    theme: 'Emotional honesty',
  },
  // 125
  {
    name: 'Okanran Odi',
    meaning: 'The heart protects what it loves; devotion to family and home brings stability.',
    theme: 'Devoted protection',
  },
  // 126
  {
    name: 'Okanran Irosun',
    meaning: 'Love for tradition strengthens the community bond; the heart anchors what the mind preserves.',
    theme: 'Community bond',
  },
  // 127
  {
    name: 'Okanran Owonrin',
    meaning: 'The heart is tested by sudden change; emotional resilience determines the outcome.',
    theme: 'Emotional resilience',
  },
  // 128
  {
    name: 'Okanran Obara',
    meaning: 'Heartfelt words carry the greatest influence; speak what you genuinely feel.',
    theme: 'Heartfelt influence',
  },
  // 129
  {
    name: 'Okanran Ogunda',
    meaning: 'Courage flows from a committed heart; the brave act because they care deeply.',
    theme: 'Courageous heart',
  },
  // 130
  {
    name: 'Okanran Osa',
    meaning: 'The heart senses danger before the mind confirms it; trust your instinctive unease.',
    theme: 'Instinctive awareness',
  },
  // 131
  {
    name: 'Okanran Ika',
    meaning: 'A patient heart endures what a restless heart cannot; cultivate inner stillness.',
    theme: 'Inner stillness',
  },
  // 132
  {
    name: 'Okanran Oturupon',
    meaning: 'Emotional wounds require as much care as physical ones; tend the heart with compassion.',
    theme: 'Compassionate care',
  },
  // 133
  {
    name: 'Okanran Otura',
    meaning: 'The heart receives messages the mind cannot decode; honor the feelings that arise during prayer.',
    theme: 'Prayerful feeling',
  },
  // 134
  {
    name: 'Okanran Irete',
    meaning: 'Unwavering devotion overcomes every trial; the determined heart will not be denied.',
    theme: 'Unwavering devotion',
  },
  // 135
  {
    name: 'Okanran Ose',
    meaning: 'Love attracts abundance; the generous heart finds its cup always overflowing.',
    theme: 'Generous love',
  },
  // 136
  {
    name: 'Okanran Ofun',
    meaning: 'A pure heart is the highest offering; sincerity of devotion pleases the Orisa.',
    theme: 'Pure devotion',
  },

  // ── Ogunda combinations (right leg: Ogunda) ─────────────────
  // 137
  {
    name: 'Ogunda Ogbe',
    meaning: 'The warrior steps into the light; disciplined effort meets favorable conditions.',
    theme: 'Favorable effort',
  },
  // 138
  {
    name: 'Ogunda Oyeku',
    meaning: 'The battle ends and rest is earned; lay down your weapons and honor the peace.',
    theme: 'Earned peace',
  },
  // 139
  {
    name: 'Ogunda Iwori',
    meaning: 'Strategic insight guides the hand of the warrior; plan carefully before you act.',
    theme: 'Strategic planning',
  },
  // 140
  {
    name: 'Ogunda Odi',
    meaning: 'The warrior defends hearth and home; protective strength serves the family.',
    theme: 'Protective strength',
  },
  // 141
  {
    name: 'Ogunda Irosun',
    meaning: 'The iron of Ogun honors the covenant of the elders; strength and tradition reinforce each other.',
    theme: 'Strengthened tradition',
  },
  // 142
  {
    name: 'Ogunda Owonrin',
    meaning: 'Sudden battle demands swift response; the prepared warrior adapts instantly.',
    theme: 'Swift adaptation',
  },
  // 143
  {
    name: 'Ogunda Obara',
    meaning: 'The war cry rallies the community; a powerful voice directs collective action.',
    theme: 'Rallying cry',
  },
  // 144
  {
    name: 'Ogunda Okanran',
    meaning: 'A warrior fights best with a clear heart; purify your motives before engaging conflict.',
    theme: 'Purified motives',
  },
  // 145
  {
    name: 'Ogunda Osa',
    meaning: 'The winds carry the warrior to unfamiliar territory; courage is needed in new environments.',
    theme: 'Courage abroad',
  },
  // 146
  {
    name: 'Ogunda Ika',
    meaning: 'Patience sharpens the blade more than haste; the disciplined fighter strikes once and succeeds.',
    theme: 'Disciplined strike',
  },
  // 147
  {
    name: 'Ogunda Oturupon',
    meaning: 'The surgeon cuts to heal; sometimes the remedy requires the courage to cause short-term pain.',
    theme: 'Healing courage',
  },
  // 148
  {
    name: 'Ogunda Otura',
    meaning: 'Divine guidance directs the warrior; Ogun fights alongside those who follow Ifa.',
    theme: 'Guided warrior',
  },
  // 149
  {
    name: 'Ogunda Irete',
    meaning: 'Relentless effort forges the path of destiny; the determined worker shapes iron into art.',
    theme: 'Forged destiny',
  },
  // 150
  {
    name: 'Ogunda Ose',
    meaning: 'Hard work yields abundant harvest; Ogun and Osun bless industrious hands.',
    theme: 'Industrious harvest',
  },
  // 151
  {
    name: 'Ogunda Ofun',
    meaning: 'The warrior lays down arms for spiritual refinement; strength serves purity of purpose.',
    theme: 'Refined strength',
  },

  // ── Osa combinations (right leg: Osa) ────────────────────────
  // 152
  {
    name: 'Osa Ogbe',
    meaning: 'The wind clears the sky and the sun appears; after turbulence comes renewal and clarity.',
    theme: 'Post-storm clarity',
  },
  // 153
  {
    name: 'Osa Oyeku',
    meaning: 'Winds from the spirit realm carry ancestral warnings; heed the whispers before the storm.',
    theme: 'Ancestral warnings',
  },
  // 154
  {
    name: 'Osa Iwori',
    meaning: 'Shifting conditions sharpen intuitive perception; uncertainty trains the inner senses.',
    theme: 'Sharpened intuition',
  },
  // 155
  {
    name: 'Osa Odi',
    meaning: 'Changing winds test the integrity of the shelter; strengthen foundations before the next gust.',
    theme: 'Strengthened foundations',
  },
  // 156
  {
    name: 'Osa Irosun',
    meaning: 'The wind respects ancient trees with deep roots; tradition endures through changing seasons.',
    theme: 'Deep roots',
  },
  // 157
  {
    name: 'Osa Owonrin',
    meaning: 'Double turbulence demands extraordinary balance; find your center amid compounding change.',
    theme: 'Extraordinary balance',
  },
  // 158
  {
    name: 'Osa Obara',
    meaning: 'Words carried by the wind reach far; consider the reach of what you speak into the air.',
    theme: 'Far-reaching words',
  },
  // 159
  {
    name: 'Osa Okanran',
    meaning: 'The heart remains steady while circumstances shift; emotional stability is your anchor.',
    theme: 'Emotional anchor',
  },
  // 160
  {
    name: 'Osa Ogunda',
    meaning: 'The wind guides the warrior to a new frontier; embrace the journey into unknown territory.',
    theme: 'New frontiers',
  },
  // 161
  {
    name: 'Osa Ika',
    meaning: 'Patient observation of the wind reveals its pattern; study change before reacting to it.',
    theme: 'Observing change',
  },
  // 162
  {
    name: 'Osa Oturupon',
    meaning: 'Fresh air heals stagnant conditions; ventilate areas of your life that have grown stale.',
    theme: 'Refreshing renewal',
  },
  // 163
  {
    name: 'Osa Otura',
    meaning: 'The wind carries the voice of Ifa across the land; prophecy travels to those who need it most.',
    theme: 'Traveling prophecy',
  },
  // 164
  {
    name: 'Osa Irete',
    meaning: 'Determination holds firm against persistent wind; the steadfast tree bends but does not break.',
    theme: 'Flexible strength',
  },
  // 165
  {
    name: 'Osa Ose',
    meaning: 'Gentle breezes carry the scent of prosperity; abundance arrives on favorable currents.',
    theme: 'Favorable currents',
  },
  // 166
  {
    name: 'Osa Ofun',
    meaning: 'The cleansing wind purifies the spirit; openness to change brings spiritual elevation.',
    theme: 'Spiritual cleansing',
  },

  // ── Ika combinations (right leg: Ika) ────────────────────────
  // 167
  {
    name: 'Ika Ogbe',
    meaning: 'Patience in the light is rewarded; the one who waits with wisdom receives the fullest blessing.',
    theme: 'Rewarded patience',
  },
  // 168
  {
    name: 'Ika Oyeku',
    meaning: 'Silent endurance through the dark night earns ancestral respect; suffer wisely and be elevated.',
    theme: 'Silent endurance',
  },
  // 169
  {
    name: 'Ika Iwori',
    meaning: 'Patient observation yields the deepest insight; watch carefully before drawing conclusions.',
    theme: 'Patient observation',
  },
  // 170
  {
    name: 'Ika Odi',
    meaning: 'Steady protection sustains what is vulnerable; consistent care nurtures growth.',
    theme: 'Steady care',
  },
  // 171
  {
    name: 'Ika Irosun',
    meaning: 'Patience preserves the covenant; endure the test and the promise will be fulfilled.',
    theme: 'Tested promise',
  },
  // 172
  {
    name: 'Ika Owonrin',
    meaning: 'Patience is tested by sudden disruption; maintain composure and the storm will pass.',
    theme: 'Calm amid disruption',
  },
  // 173
  {
    name: 'Ika Obara',
    meaning: 'Knowing when to speak and when to remain silent is the highest eloquence; master the pause.',
    theme: 'Mastered silence',
  },
  // 174
  {
    name: 'Ika Okanran',
    meaning: 'A patient heart accumulates wisdom; slow emotional processing produces deep understanding.',
    theme: 'Accumulated wisdom',
  },
  // 175
  {
    name: 'Ika Ogunda',
    meaning: 'The patient warrior outlasts the reckless one; timing in battle determines the victor.',
    theme: 'Strategic timing',
  },
  // 176
  {
    name: 'Ika Osa',
    meaning: 'Wait for the wind to settle before setting sail; patience with conditions ensures safe passage.',
    theme: 'Safe passage',
  },
  // 177
  {
    name: 'Ika Oturupon',
    meaning: 'Slow, consistent treatment heals what rushed remedies cannot; trust gradual recovery.',
    theme: 'Gradual recovery',
  },
  // 178
  {
    name: 'Ika Otura',
    meaning: 'The meaning of prophecy unfolds over time; do not rush to interpret what the divine reveals.',
    theme: 'Unfolding meaning',
  },
  // 179
  {
    name: 'Ika Irete',
    meaning: 'Patient persistence is an unstoppable force; the slow but steady traveler reaches the destination.',
    theme: 'Steady progress',
  },
  // 180
  {
    name: 'Ika Ose',
    meaning: 'Patient investment yields the richest return; allow blessings to compound over time.',
    theme: 'Compounding blessings',
  },
  // 181
  {
    name: 'Ika Ofun',
    meaning: 'Spiritual refinement requires patient practice; purity develops through consistent devotion.',
    theme: 'Patient devotion',
  },

  // ── Oturupon combinations (right leg: Oturupon) ─────────────
  // 182
  {
    name: 'Oturupon Ogbe',
    meaning: 'Healing brings the body back to the light; recovery opens a renewed appreciation for life.',
    theme: 'Joyful recovery',
  },
  // 183
  {
    name: 'Oturupon Oyeku',
    meaning: 'Deep illness touches the soul; healing requires addressing the spiritual root, not just the symptom.',
    theme: 'Soul-level healing',
  },
  // 184
  {
    name: 'Oturupon Iwori',
    meaning: 'Insight into the cause of disease is half the cure; diagnose with precision and care.',
    theme: 'Precise diagnosis',
  },
  // 185
  {
    name: 'Oturupon Odi',
    meaning: 'The body protects itself through symptoms; listen to what your body is communicating.',
    theme: 'Body wisdom',
  },
  // 186
  {
    name: 'Oturupon Irosun',
    meaning: 'Ancestral remedies hold time-tested power; traditional medicine complements modern understanding.',
    theme: 'Traditional medicine',
  },
  // 187
  {
    name: 'Oturupon Owonrin',
    meaning: 'A health crisis forces necessary change; illness redirects the path toward greater balance.',
    theme: 'Redirected balance',
  },
  // 188
  {
    name: 'Oturupon Obara',
    meaning: 'Speaking about illness diminishes its power; name the problem and begin the healing process.',
    theme: 'Naming to heal',
  },
  // 189
  {
    name: 'Oturupon Okanran',
    meaning: 'Emotional health and physical health are inseparable; tend to the heart to heal the body.',
    theme: 'Holistic health',
  },
  // 190
  {
    name: 'Oturupon Ogunda',
    meaning: 'Surgical precision removes what threatens the whole; decisive action saves what can be saved.',
    theme: 'Decisive healing',
  },
  // 191
  {
    name: 'Oturupon Osa',
    meaning: 'Fresh circumstances restore depleted vitality; a change of environment supports recovery.',
    theme: 'Environmental healing',
  },
  // 192
  {
    name: 'Oturupon Ika',
    meaning: 'Slow and steady healing is more lasting than quick fixes; honor the pace of genuine recovery.',
    theme: 'Lasting recovery',
  },
  // 193
  {
    name: 'Oturupon Otura',
    meaning: 'Divine guidance reveals the remedy; seek Ifa consultation when conventional approaches fail.',
    theme: 'Divinely guided remedy',
  },
  // 194
  {
    name: 'Oturupon Irete',
    meaning: 'The determined patient recovers fully; persistence in treatment and faith brings restoration.',
    theme: 'Determined recovery',
  },
  // 195
  {
    name: 'Oturupon Ose',
    meaning: 'Prosperity supports healing; secure the resources needed for proper care and recovery.',
    theme: 'Resourced healing',
  },
  // 196
  {
    name: 'Oturupon Ofun',
    meaning: 'Purification of body and spirit brings wholeness; cleansing rituals restore spiritual health.',
    theme: 'Purified wholeness',
  },

  // ── Otura combinations (right leg: Otura) ────────────────────
  // 197
  {
    name: 'Otura Ogbe',
    meaning: 'Divine revelation shines with unmistakable clarity; the message of Ifa is plain and direct.',
    theme: 'Clear revelation',
  },
  // 198
  {
    name: 'Otura Oyeku',
    meaning: 'Messages from the beyond arrive through dreams and visions; the spirit realm speaks clearly.',
    theme: 'Visionary dreams',
  },
  // 199
  {
    name: 'Otura Iwori',
    meaning: 'Prophecy and inner knowing converge; trust the alignment of divine message and personal intuition.',
    theme: 'Aligned knowing',
  },
  // 200
  {
    name: 'Otura Odi',
    meaning: 'Sacred communication gestates in quiet reflection; revelation comes after contemplation.',
    theme: 'Contemplative revelation',
  },
  // 201
  {
    name: 'Otura Irosun',
    meaning: 'The prophetic tradition passes from generation to generation; the chain of wisdom is unbroken.',
    theme: 'Unbroken wisdom',
  },
  // 202
  {
    name: 'Otura Owonrin',
    meaning: 'An unexpected sign demands immediate interpretation; do not dismiss what you cannot explain.',
    theme: 'Unexpected sign',
  },
  // 203
  {
    name: 'Otura Obara',
    meaning: 'The divine message must be spoken aloud; share the wisdom revealed to you with those who need it.',
    theme: 'Shared wisdom',
  },
  // 204
  {
    name: 'Otura Okanran',
    meaning: 'Feel the truth of the message in your heart; genuine revelation resonates in the chest.',
    theme: 'Resonant truth',
  },
  // 205
  {
    name: 'Otura Ogunda',
    meaning: 'Act upon the divine message with determination; revelation without action is incomplete.',
    theme: 'Activated revelation',
  },
  // 206
  {
    name: 'Otura Osa',
    meaning: 'The message of Ifa travels far on spiritual winds; prophecy reaches those destined to hear it.',
    theme: 'Destined message',
  },
  // 207
  {
    name: 'Otura Ika',
    meaning: 'Wait patiently for the full revelation; partial prophecy must not be acted upon prematurely.',
    theme: 'Full revelation',
  },
  // 208
  {
    name: 'Otura Oturupon',
    meaning: 'Divination reveals the remedy for ailment; Ifa prescribes the medicine the healer administers.',
    theme: 'Prescribed remedy',
  },
  // 209
  {
    name: 'Otura Irete',
    meaning: 'Persistent seeking of divine guidance builds unshakable faith; the devoted student of Ifa is rewarded.',
    theme: 'Devoted seeking',
  },
  // 210
  {
    name: 'Otura Ose',
    meaning: 'Prophetic guidance leads to prosperity; follow the counsel of Ifa and abundance will follow.',
    theme: 'Prophetic prosperity',
  },
  // 211
  {
    name: 'Otura Ofun',
    meaning: 'The purest channel receives the clearest message; spiritual purity enhances prophetic clarity.',
    theme: 'Prophetic clarity',
  },

  // ── Irete combinations (right leg: Irete) ────────────────────
  // 212
  {
    name: 'Irete Ogbe',
    meaning: 'Determination meets opportunity in the light; the persistent seeker finds the open door.',
    theme: 'Found opportunity',
  },
  // 213
  {
    name: 'Irete Oyeku',
    meaning: 'Persistence endures even through the darkest hour; the one who does not quit cannot be defeated.',
    theme: 'Undefeated spirit',
  },
  // 214
  {
    name: 'Irete Iwori',
    meaning: 'Firm resolve guided by inner vision accomplishes the extraordinary; see it and pursue it relentlessly.',
    theme: 'Relentless pursuit',
  },
  // 215
  {
    name: 'Irete Odi',
    meaning: 'Persistence in nurturing brings the harvest; tend your garden faithfully and it will yield.',
    theme: 'Faithful tending',
  },
  // 216
  {
    name: 'Irete Irosun',
    meaning: 'Dedication to tradition ensures its survival; the committed practitioner becomes a living library.',
    theme: 'Living tradition',
  },
  // 217
  {
    name: 'Irete Owonrin',
    meaning: 'Persistence through upheaval defines character; endure the disruption and emerge stronger.',
    theme: 'Strengthened character',
  },
  // 218
  {
    name: 'Irete Obara',
    meaning: 'The persistent voice is eventually heard; repeat your message until it reaches the right ears.',
    theme: 'Persistent voice',
  },
  // 219
  {
    name: 'Irete Okanran',
    meaning: 'A devoted heart never abandons its cause; loyalty to purpose defines the noble soul.',
    theme: 'Noble loyalty',
  },
  // 220
  {
    name: 'Irete Ogunda',
    meaning: 'The tireless worker forges a legacy of iron; consistent effort builds what endures.',
    theme: 'Enduring legacy',
  },
  // 221
  {
    name: 'Irete Osa',
    meaning: 'Persistence navigates changing conditions; the steady hand adjusts the sail but keeps the course.',
    theme: 'Adjusted course',
  },
  // 222
  {
    name: 'Irete Ika',
    meaning: 'Double patience multiplies the reward; the one who persists patiently receives the greatest portion.',
    theme: 'Multiplied reward',
  },
  // 223
  {
    name: 'Irete Oturupon',
    meaning: 'Persistent care restores health completely; do not abandon the treatment before the cure is complete.',
    theme: 'Complete restoration',
  },
  // 224
  {
    name: 'Irete Otura',
    meaning: 'The lifelong student of Ifa receives the deepest mysteries; persist in learning and truth opens.',
    theme: 'Deep mysteries',
  },
  // 225
  {
    name: 'Irete Ose',
    meaning: 'Persistent effort attracts lasting abundance; wealth built gradually endures the longest.',
    theme: 'Lasting wealth',
  },
  // 226
  {
    name: 'Irete Ofun',
    meaning: 'Determined pursuit of spiritual purity transforms the devotee; persistence in practice is the path to mastery.',
    theme: 'Spiritual mastery',
  },

  // ── Ose combinations (right leg: Ose) ────────────────────────
  // 227
  {
    name: 'Ose Ogbe',
    meaning: 'Abundance flows freely in the light; blessings multiply when shared with open hands.',
    theme: 'Shared blessings',
  },
  // 228
  {
    name: 'Ose Oyeku',
    meaning: 'Hidden reserves of wealth are revealed; trust that provision exists even when unseen.',
    theme: 'Hidden reserves',
  },
  // 229
  {
    name: 'Ose Iwori',
    meaning: 'Intuition guides prosperous decisions; follow inner wisdom in matters of finance and trade.',
    theme: 'Prosperous intuition',
  },
  // 230
  {
    name: 'Ose Odi',
    meaning: 'Fertile ground receives the seed of prosperity; invest in what nurtures genuine growth.',
    theme: 'Fertile investment',
  },
  // 231
  {
    name: 'Ose Irosun',
    meaning: 'Ancestral blessings flow as material abundance; honor your lineage and prosperity follows.',
    theme: 'Lineage prosperity',
  },
  // 232
  {
    name: 'Ose Owonrin',
    meaning: 'A sudden windfall tests your character; handle unexpected wealth with wisdom and gratitude.',
    theme: 'Wise windfall',
  },
  // 233
  {
    name: 'Ose Obara',
    meaning: 'Words of gratitude attract more blessings; give thanks and the river of abundance widens.',
    theme: 'Grateful attraction',
  },
  // 234
  {
    name: 'Ose Okanran',
    meaning: 'A generous heart is a wealthy heart; true riches are measured in love freely given.',
    theme: 'Heart-centered wealth',
  },
  // 235
  {
    name: 'Ose Ogunda',
    meaning: 'Hard labor paired with blessings yields the greatest harvest; Ogun and Osun work hand in hand.',
    theme: 'Blessed labor',
  },
  // 236
  {
    name: 'Ose Osa',
    meaning: 'The flow of abundance shifts course; be ready to receive blessings from a new direction.',
    theme: 'Redirected blessings',
  },
  // 237
  {
    name: 'Ose Ika',
    meaning: 'Patient cultivation of resources builds enduring wealth; do not rush the harvest.',
    theme: 'Cultivated wealth',
  },
  // 238
  {
    name: 'Ose Oturupon',
    meaning: 'Prosperity supports the process of healing; secure abundance so that care is never lacking.',
    theme: 'Healing prosperity',
  },
  // 239
  {
    name: 'Ose Otura',
    meaning: 'Divine wisdom guides financial decisions; consult Ifa before major investments or expenditures.',
    theme: 'Guided prosperity',
  },
  // 240
  {
    name: 'Ose Irete',
    meaning: 'Persistent effort in trade builds lasting success; the diligent merchant never goes hungry.',
    theme: 'Diligent success',
  },
  // 241
  {
    name: 'Ose Ofun',
    meaning: 'Pure motives in business attract divine favor; let integrity be the foundation of your commerce.',
    theme: 'Integrity in commerce',
  },

  // ── Ofun combinations (right leg: Ofun) ──────────────────────
  // 242
  {
    name: 'Ofun Ogbe',
    meaning: 'Purity meets the light of a new beginning; a clean heart attracts fresh blessings.',
    theme: 'Fresh beginning',
  },
  // 243
  {
    name: 'Ofun Oyeku',
    meaning: 'The white cloth covers the departed with honor; sacred endings deserve reverent observance.',
    theme: 'Reverent closure',
  },
  // 244
  {
    name: 'Ofun Iwori',
    meaning: 'Spiritual clarity reveals what truly matters; purify perception to see with the eyes of the soul.',
    theme: 'Soul perception',
  },
  // 245
  {
    name: 'Ofun Odi',
    meaning: 'A purified vessel receives new life; cleanse the inner space to prepare for what is coming.',
    theme: 'Purified readiness',
  },
  // 246
  {
    name: 'Ofun Irosun',
    meaning: 'Purity of practice honors the ancestors; maintain the highest standard of spiritual conduct.',
    theme: 'Highest standard',
  },
  // 247
  {
    name: 'Ofun Owonrin',
    meaning: 'Sudden purification strips away pretense; what remains after the fire is the authentic self.',
    theme: 'Authentic self',
  },
  // 248
  {
    name: 'Ofun Obara',
    meaning: 'Pure words heal and restore; let every syllable you speak be worthy of the sacred.',
    theme: 'Sacred speech',
  },
  // 249
  {
    name: 'Ofun Okanran',
    meaning: 'A purified heart is the truest compass; let sincerity guide every decision.',
    theme: 'Sincere guidance',
  },
  // 250
  {
    name: 'Ofun Ogunda',
    meaning: 'Purity empowers righteous action; the clean-handed warrior fights with divine authority.',
    theme: 'Righteous authority',
  },
  // 251
  {
    name: 'Ofun Osa',
    meaning: 'A purifying wind sweeps away impurities; welcome the cleansing breeze of change.',
    theme: 'Cleansing change',
  },
  // 252
  {
    name: 'Ofun Ika',
    meaning: 'Patient purification removes deeply held impurities; lasting purity is achieved gradually.',
    theme: 'Gradual purification',
  },
  // 253
  {
    name: 'Ofun Oturupon',
    meaning: 'Spiritual cleansing heals what medicine alone cannot; purity of spirit restores the body.',
    theme: 'Spiritual restoration',
  },
  // 254
  {
    name: 'Ofun Otura',
    meaning: 'The purest devotee receives the most lucid prophecy; clarity of spirit yields clarity of message.',
    theme: 'Lucid prophecy',
  },
  // 255
  {
    name: 'Ofun Irete',
    meaning: 'Unwavering commitment to purity builds an unblemished legacy; the devoted life speaks for itself.',
    theme: 'Unblemished legacy',
  },
  // 256
  {
    name: 'Ofun Ose',
    meaning: 'Pure generosity attracts the deepest abundance; give from a clean heart and receive without measure.',
    theme: 'Boundless generosity',
  },
];
