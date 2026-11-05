import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { DECK_RULES } from '../decks/deck-rules';

export class PatternCardDto {
    @IsInt()
    cardId!: number;

    @IsInt()
    @Min(1)
    @Max(DECK_RULES.maxCopies)
    quantity!: number;
}

export class SaveSidePatternDto {
    // Spaces around the name are removed before validation
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    opponentDeckName!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string | null;

    // The Side Deck has at most 15 cards, so a valid pattern never needs more netries
    @IsArray()
    @ArrayMaxSize(DECK_RULES.sideMax)
    @ValidateNested({ each: true })
    @Type(() => PatternCardDto)
    cardsOut!: PatternCardDto[];

    @IsArray()
    @ArrayMaxSize(DECK_RULES.sideMax)
    @ValidateNested({ each: true })
    @Type(() => PatternCardDto)
    cardsIn!: PatternCardDto[];
}