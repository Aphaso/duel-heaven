import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './create-card.dto';

@Injectable()
export class CardsService {
    constructor(private readonly prisma: PrismaService){}

    findAll() {
        return this.prisma.card.findMany({ orderBy: { name: 'asc' } });
    }

    create(dto: CreateCardDto) {
        return this.prisma.card.create({ data: dto });
    }
}