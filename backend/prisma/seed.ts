import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Password for all users
    const password = await bcrypt.hash('password123', 10);

    // --- USERS: ADMIN ---
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ile-ase.test' },
        update: {},
        create: {
            email: 'admin@ile-ase.test',
            name: 'Chief Adebayo',
            passwordHash: password,
            role: 'ADMIN',
            verified: true,
            hasOnboarded: true,
            culturalLevel: 'Omo Awo',
            yorubaName: 'Adébáyọ̀',
            avatar: 'https://images.unsplash.com/photo-1542080681-b52d382432af?q=80&w=300&auto=format&fit=crop',
        },
    });

    // --- USERS: CLIENTS ---
    const clients = [
        {
            email: 'client1@ile-ase.test',
            name: 'Adewale Ogunleye',
            yorubaName: 'Adéwálé',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
            bio: 'Software engineer by day, seeker of ancient wisdom by night. Learning the ways of the Orisha gradually.',
            location: 'Lagos, Nigeria',
        },
        {
            email: 'client2@ile-ase.test',
            name: 'Chioma Okonkwo',
            yorubaName: 'Omolara',
            avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop',
            bio: 'Artist and storyteller. Exploring the intersections of Igbo and Yoruba spirituality.',
            location: 'Enugu, Nigeria',
        },
        {
            email: 'client3@ile-ase.test',
            name: 'Marcus Johnson',
            yorubaName: 'Ifádàyọ̀',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
            bio: 'African American rediscovering my ancestry. New to everything but eager to learn.',
            location: 'Atlanta, USA',
        },
    ];

    for (const c of clients) {
        await prisma.user.upsert({
            where: { email: c.email },
            update: {},
            create: {
                email: c.email,
                name: c.name,
                yorubaName: c.yorubaName,
                passwordHash: password,
                role: 'CLIENT',
                verified: true,
                hasOnboarded: true,
                culturalLevel: 'Omo Ilé',
                avatar: c.avatar,
                bio: c.bio,
                location: c.location,
            },
        });
    }

    // --- USERS: BABALAWOS ---
    const babalawosData = [
        {
            email: 'baba1@ile-ase.test',
            name: 'Baba Ifatunde Alabi',
            yorubaName: 'Ifátúndé',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
            bio: 'Initiated Babalawo with 30 years of experience. Preserving the integrity of our tradition. I specialize in Dafa and lifecycle ceremonies.',
            location: 'Osogbo, Osun State',
            culturalLevel: 'Babalawo',
            specialties: ['Dafa', 'Naming Ceremony', 'Marriage Rites'],
        },
        {
            email: 'baba2@ile-ase.test',
            name: 'Iya Funmilayo',
            yorubaName: 'Yeye Oge',
            avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=300&auto=format&fit=crop',
            bio: 'Priestess of Obatala. Specializing in clarity, peace, and white cloth ceremonies. I help those seeking mental clarity and spiritual purity.',
            location: 'Ile-Ife, Osun State',
            culturalLevel: 'Iyanifa',
            specialties: ['Obatala Cleansing', 'Peace Work', 'Fertility'],
        },
        {
            email: 'baba3@ile-ase.test',
            name: 'Chief Solagbade Popoola',
            yorubaName: 'Ṣolágbádé',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
            bio: 'Renowned Ifa scholar and teacher. Dedicated to teaching the ethics and philosophy of Ifa to the next generation.',
            location: 'Lagos, Nigeria',
            culturalLevel: 'Babalawo',
            specialties: ['Ifa Ethics', 'Training', 'Advanced Divination'],
        },
        {
            email: 'baba4@ile-ase.test',
            name: 'Baba Awolowo',
            yorubaName: 'Awólọ́wọ̀',
            avatar: 'https://images.unsplash.com/photo-1545167622-3a6ac156bb0f?q=80&w=300&auto=format&fit=crop',
            bio: 'Expert in herbal medicine (Akose) and spiritual fortification. My work is grounded in the deep knowledge of leaves and roots.',
            location: 'Abeokuta, Ogun State',
            culturalLevel: 'Onisegun',
            specialties: ['Herbal Medicine', 'Protection', 'Healing'],
        },
        {
            email: 'baba5@ile-ase.test',
            name: 'Iya Osuntingi',
            yorubaName: 'Ọ̀ṣuntinú',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
            bio: 'Daughter of the River. I facilitate connection with the elemental forces of nature, particularly for women and children.',
            location: 'Osogbo, Osun State',
            culturalLevel: 'Iyalorisa',
            specialties: ['Osun Worship', 'Children Blessings', 'Water Rituals'],
        }
    ];

    const createdBabalawos = [];
    for (const b of babalawosData) {
        const user = await prisma.user.upsert({
            where: { email: b.email },
            update: {
                role: 'BABALAWO',
            },
            create: {
                email: b.email,
                name: b.name,
                yorubaName: b.yorubaName,
                passwordHash: password,
                role: 'BABALAWO',
                verified: true,
                hasOnboarded: true,
                culturalLevel: b.culturalLevel,
                avatar: b.avatar,
                bio: b.bio,
                location: b.location,
                interests: b.specialties,
            },
        });
        createdBabalawos.push(user);

        // Create Verification Application
        await prisma.verificationApplication.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                lineage: 'Oyo Heritage',
                yearsOfService: 15,
                mentorEndorsements: [], // Added
                documentation: [],      // Added
                specialization: b.specialties,
                languages: ['Yoruba', 'English'],
                currentStage: 'CERTIFICATION',
                tier: 'MASTER',
                approvedById: admin.id,
                approvedAt: new Date(),
            }
        });

        // Create Certificate
        await prisma.certificate.create({
            data: {
                userId: user.id,
                title: `Certified ${b.culturalLevel}`,
                issuer: 'Council of Elders',
                date: '2020-01-01',
                tier: 'MASTER'
            }
        });
    }

    // --- TEMPLES ---
    const templesData = [
        {
            name: 'Ilé Ori Temple',
            slug: 'ile-ori-temple',
            yorubaName: 'Ilé Orí',
            description: 'A sanctuary dedicated to the elevation of consciousness through Ori. We hold weekly sunday services and monthly festivals.',
            location: 'Lagos, Nigeria',
            city: 'Lagos',
            state: 'Lagos',
            type: 'ILE_IFA',
            founderIndex: 0,
            images: ['https://images.unsplash.com/photo-1548544149-4835e62ee5b3?q=80&w=600&auto=format&fit=crop'],
            membersIndices: [0, 2],
        },
        {
            name: 'Osun Grove Sanctuary',
            slug: 'osun-grove-sanctuary',
            yorubaName: 'Igbó Ọ̀ṣun',
            description: 'Located at the edge of the sacred grove, we welcome all children of the river for healing and renewal.',
            location: 'Osogbo, Osun State',
            city: 'Osogbo',
            state: 'Osun',
            type: 'STUDY_CIRCLE',
            founderIndex: 4,
            images: ['https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=600&auto=format&fit=crop'],
            membersIndices: [4, 1],
        },
        {
            name: 'Ilé Ifẹ̀ Ancestral Center',
            slug: 'ile-ife-center',
            yorubaName: 'Ilé Ifẹ̀',
            description: 'The cradle of civilization. We preserve the oldest traditions of Obatala and the Ooni lineage.',
            location: 'Ile-Ife, Osun State',
            city: 'Ile-Ife',
            state: 'Osun',
            type: 'ILE_IFA',
            founderIndex: 1,
            images: ['https://images.unsplash.com/photo-1599583236384-9343729f2712?auto=format&fit=crop&q=80'],
            membersIndices: [1],
        },
        {
            name: 'Ogboni Fraternity Hall',
            slug: 'ogboni-hall',
            yorubaName: 'Ilé Ògbóni',
            description: 'A meeting place for the elders and those seeking deep esoteric knowledge of earth and justice.',
            location: 'Abeokuta, Ogun State',
            city: 'Abeokuta',
            state: 'Ogun',
            type: 'ILE_IFA',
            founderIndex: 3,
            images: ['https://images.unsplash.com/photo-1590059390046-2b47e9d29312?auto=format&fit=crop&q=80'],
            membersIndices: [3],
        }
    ];

    const createdTemples = [];

    for (const t of templesData) {
        const founder = createdBabalawos[t.founderIndex];

        let temple = await prisma.temple.findUnique({ where: { slug: t.slug } });

        if (!temple) {
            temple = await prisma.temple.create({
                data: {
                    name: t.name,
                    yorubaName: t.yorubaName,
                    slug: t.slug,
                    description: t.description,
                    location: t.location,
                    city: t.city,
                    state: t.state,
                    type: t.type,
                    verified: true,
                    status: 'ACTIVE',
                    founderId: founder.id,
                    images: t.images,
                    bannerImage: t.images[0],
                    babalawoCount: t.membersIndices.length,
                },
            });
        }
        createdTemples.push(temple);

        for (const idx of t.membersIndices) {
            const baba = createdBabalawos[idx];
            await prisma.user.update({
                where: { id: baba.id },
                data: { templeId: temple.id }
            });
        }
    }

    // --- EVENTS ---
    const eventsData = [
        {
            title: 'Weekly Dafa Practice',
            slug: 'weekly-dafa-practice',
            description: 'Join us for a review of the Odu Ifa cast for the week. Bring your Opele.',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            type: 'EDUCATIONAL',
            templeIndex: 0,
            creatorIndex: 0,
            location: 'Main Hall',
            image: null,
        },
        {
            title: 'Osun Festival 2026',
            slug: 'osun-festival-2026',
            description: 'The annual celebration of the River Goddess. Procession starts at 10am.',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
            type: 'CEREMONY',
            templeIndex: 1,
            creatorIndex: 4,
            location: 'River Bank',
            image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=300&auto=format&fit=crop',
        },
        {
            title: 'New Moon Ritual',
            slug: 'new-moon-ritual',
            description: 'Monthly gathering to set intentions for the new lunar cycle.',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            type: 'RITUAL',
            templeIndex: 2,
            creatorIndex: 1,
            location: 'Temple Courtyard',
            image: null,
        }
    ];

    for (const e of eventsData) {
        await prisma.event.upsert({
            where: { slug: e.slug },
            update: {},
            create: {
                title: e.title,
                slug: e.slug,
                description: e.description,
                startDate: e.date,
                endDate: new Date(e.date.getTime() + 1000 * 60 * 60 * 2),
                type: e.type,
                location: e.location,
                templeId: createdTemples[e.templeIndex].id,
                creatorId: createdBabalawos[e.creatorIndex].id,
                published: true,
                status: 'UPCOMING',
                image: e.image,
            }
        });
    }

    // --- FORUM ---
    const forumCategories = [
        { name: 'General Discussion', slug: 'general-discussion', icon: 'MessageSquare', description: 'General talk about anything.' },
        { name: 'Ifá Philosophy', slug: 'ifa-philosophy', icon: 'BookOpen', description: 'Deep dive into the Odu Ifa.' },
        { name: 'Ancestral Veneration', slug: 'ancestral-veneration', icon: 'Users', description: 'Honoring those who came before.' },
        { name: 'Dreams & Divination', slug: 'dreams-divination', icon: 'Moon', description: 'Interpreting signs and dreams.' },
    ];

    for (const cat of forumCategories) {
        await prisma.forumCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: {
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                description: cat.description,
            }
        });
    }

    console.log('✅ Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
