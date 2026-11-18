import { Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readdir, rename, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

const IMAGES_DIR = join(process.cwd(), 'storage', 'card-images', 'small');
const CHUNK_SIZE = 10;
const MIN_CHUNK_MS = 700;
// 10 requests every 700 milliseconds makes it around 14 requests every second, not breaking the API limit of 20 requests per second

@Injectable()
export class CardImagesService {
    private readonly logger = new Logger(CardImagesService.name);
    private running = false;
    private progress = { total: 0, done: 0, failed: 0 };

    constructor(private readonly prisma: PrismaService) {}

    status() {
        return { running: this.running, ...this.progress };
    }

    start() {
        if (this.running) {
            return { started: false, message: 'Download già in corso' };
        }
        this.running = true;
        this.progress = { total: 0, done: 0, failed: 0 };

        void this.run().catch((err) => this.logger.error('Download immagini interrotto', err)).finally(() => {
            this.running = false;
        });

        return { started: true};
    }

    getImage(cardId: number) {
        const path = this.filePath(cardId);
        if (!existsSync(path)) {
            throw new NotFoundException(`Immagine della carta ${cardId} non disponibile`);
        }
        return new StreamableFile(createReadStream(path), { type: 'image/jpeg' });
    }

    /** The bytes of the image, or null if it has not been downloaded yet */
    async read(cardId: number): Promise<Buffer | null> {
        try {
            return await readFile(this.filePath(cardId));
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw err;
        }
    }

    private filePath(cardId: number) {
        return join(IMAGES_DIR, `${cardId}.jpg`);
    }

    private async run() {
        await mkdir(IMAGES_DIR, { recursive: true });

        const existing = new Set(await readdir(IMAGES_DIR));
        const cards = await this.prisma.card.findMany({
            where: { imageSmallUrl: { not: null } },
            select: { id: true, imageSmallUrl: true },
        });
        const missing = cards.filter((c) => !existing.has(`${c.id}.jpg`));

        this.progress.total = missing.length;
        this.logger.log(`Immagini da scaricare: ${missing.length}`);

        for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
            const startedAt = Date.now();
            const chunk = missing.slice(i, i + CHUNK_SIZE);

            await Promise.all(
                chunk.map((c) => this.download(c.id, c.imageSmallUrl as string)),
            );

            const elapsed = Date.now() - startedAt;
            if (elapsed < MIN_CHUNK_MS) {
                await new Promise((resolve) => setTimeout(resolve, MIN_CHUNK_MS - elapsed));
            }
            if ((i / CHUNK_SIZE) % 50 === 0) {
                const { done, failed, total } = this.progress;
                this.logger.log(`Progresso: ${done}/${total} (fallite: ${failed})`);
            }
        }

        this.logger.log(`Download terminato: ${this.progress.done} scaricate, ${this.progress.failed} fallite.`);
    }

    private async download(cardId: number, url: string) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Errore con stato ${res.status}`);
            }
            const buffer = Buffer.from(await res.arrayBuffer());

            const finalPath = this.filePath(cardId);
            const tmpPath = `${finalPath}.tmp`;
            await writeFile(tmpPath, buffer);
            await rename(tmpPath, finalPath);
            /* Writing on a temporary file first and THEN renaming it to the actual file with
               the actual path removes the possibility of having an half written image on disk
               in case of an error during the download
            */

            this.progress.done++;
        } catch (err) {
            this.progress.failed++;
            this.logger.warn(`Carta ${cardId}: download fallito (${(err as Error).message})`);
        }
    }
}