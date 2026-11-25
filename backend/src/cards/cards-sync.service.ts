import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const BATCH_SIZE = 500;

interface ApiCard {
    id: number;
    name: string;
    type: string;
    frameType?: string;
    desc: string;
    atk?: number;
    def?: number;
    level?: number;
    race?: string;
    attribute?: string;
    archetype?: string;
    card_images?: { id: number; image_url?: string; image_url_small?: string } [];
}

@Injectable()
export class CardsSyncService {
    private readonly logger = new Logger(CardsSyncService.name);

    constructor(private readonly prisma: PrismaService) {}

    async sync() {
        this.logger.log('Downloading catalog from YGOPRODeck...');
        const res = await fetch(API_URL);
        if (!res.ok) {
            throw new Error(`YGOPRODeck answered with status ${res.status}`);
        }
        const body = (await res.json()) as { data: ApiCard[] };
        const cards = body.data;
        this.logger.log(`Received ${cards.length} cards, saving...`);

        for (let i = 0; i < cards.length; i += BATCH_SIZE) {
            const batch = cards.slice(i, i + BATCH_SIZE);
            await this.prisma.$transaction(
                batch.map((card) => {
                    const data = this.toData(card);
                    return this.prisma.card.upsert({
                        where: { id: card.id },
                        update: data,
                        create: { id: card.id, ...data },
                    });
                }),
            );
        }

        this.logger.log('Synchronization complete.');
        return { synced: cards.length };
    }

    /** Convert the card obtained from the API to a card in my defined model */
    private toData(card: ApiCard) {
        return {
            name: card.name,
            type: card.type,
            frameType: card.frameType ?? null,
            desc: card.desc,
            atk: card.atk ?? null,
            def: card.def ?? null,
            level: card.level ?? null,
            race: card.race ?? null,
            attribute: card.attribute ?? null,
            archetype: card.archetype ?? null,
            imageUrl: card.card_images?.[0]?.image_url ?? null,
            imageSmallUrl: card.card_images?.[0]?.image_url_small ?? null,
        };
    }
}