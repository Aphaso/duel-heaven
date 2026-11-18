import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PDFDocument, type PDFImage } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import { CardImagesService } from '../cards/card-images.service';
import { A4_MM, expandRows, pageCount, placements, proxyGrid, PROXY_CARD_MM, type ProxyRequestRow } from './proxy-layout';
import { checkProxyRows, copiesByCard } from './proxy-rules';

// 1 millimetre in PDF points (1 point = 1/72 inch)
const MM = 72 / 25.4;

@Injectable()
export class ProxiesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly images: CardImagesService,
    ) {}

    /** The PDF with the chosen cards, 59 x 86 mm each, on A4 pages. */
    async build(userId: string, deckId: string, rows: ProxyRequestRow[]): Promise<Uint8Array> {
        const deck = await this.prisma.deck.findFirst({
            where: { id: deckId, ownerId: userId },
            select: { name: true, cards: { select: { cardId: true, quantity: true } } },
        });
        if (!deck) {
            throw new NotFoundException(`Deck ${deckId} not found`);
        }

        const problems = checkProxyRows(rows, copiesByCard(deck.cards));
        if (problems.length > 0) {
            throw new BadRequestException(problems);
        }

        const cardIds = expandRows(rows); // one entry per printed card
        const bytes = await this.readImages([...new Set(cardIds)]);

        const pdf = await PDFDocument.create();
        pdf.setTitle(`${deck.name} - proxies`);

        // Every distinct image is embedded once, then drawn as many times as needed
        const embedded = new Map<number, PDFImage>();
        for (const [cardId, data] of bytes) {
            embedded.set(cardId, await pdf.embedJpg(data));
        }

        const grid = proxyGrid();
        const pages = Array.from({ length: pageCount(cardIds.length, grid) }, () =>
            pdf.addPage([A4_MM.width * MM, A4_MM.height * MM]),
        );
        const spots = placements(cardIds.length, grid);

        cardIds.forEach((cardId, i) => {
            const spot = spots[i]!;
            pages[spot.page]!.drawImage(embedded.get(cardId)!, {
                x: spot.x * MM,
                // The layout measures from the top of the page, PDF from the bottom
                y: (A4_MM.height - spot.y - PROXY_CARD_MM.height) * MM,
                width: PROXY_CARD_MM.width * MM,
                height: PROXY_CARD_MM.height * MM,
            });
        });

        return pdf.save();
    }

    /** The images of the cards. If some are not downloaded yet it says which ones. */
    private async readImages(cardIds: number[]): Promise<Map<number, Buffer>> {
        const found = await Promise.all(
            cardIds.map(async (id) => [id, await this.images.read(id)] as const),
        );
        const missing = found.filter(([, data]) => data === null).map(([id]) => id);
        if (missing.length > 0) {
            const cards = await this.prisma.card.findMany({
                where: { id: { in: missing } },
                select: { name: true },
            });
            throw new ConflictException(
                `The images of these Cards are not downloaded yet: ${cards.map((c) => c.name).join(', ')}`,
            );
        }
        return new Map(found.map(([id, data]) => [id, data!]));
    }
}