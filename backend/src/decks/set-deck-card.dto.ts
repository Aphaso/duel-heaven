import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { DeckSection } from '../generated/prisma/enums';
import { DECK_RULES } from './deck-rules';

export class SetDeckCardDto {
    @IsInt()
    cardId!: number;

    @IsEnum(DeckSection)
    section!: DeckSection;

    @IsInt()
    @Min(1)
    @Max(DECK_RULES.maxCopies)
    quantity!: number;
}