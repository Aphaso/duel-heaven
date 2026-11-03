import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { DeckSection } from '../generated/prisma/enums';
import { DECK_RULES } from './deck-rules';

export class DeckListEntryDto {
    @IsInt()
    cardId!: number;

    @IsEnum(DeckSection)
    section!: DeckSection;

    @IsInt()
    @Min(1)
    @Max(DECK_RULES.maxCopies)
    quantity!: number;
}

export class SaveDeckListDto {
    @IsArray()
    @ArrayMaxSize(DECK_RULES.mainMax + DECK_RULES.extraMax + DECK_RULES.sideMax)
    @ValidateNested({ each: true })
    @Type(() => DeckListEntryDto)
    cards!: DeckListEntryDto[];
}