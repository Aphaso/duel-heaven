import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { WTH_LIMITS } from './wth-rules';

export class WthResponseDto {
    @IsInt()
    @Min(1)
    cardId!: number;
}

export class WthEntryDto {
    @IsInt()
    @Min(1)
    targetCardId!: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string | null;

    @IsArray()
    @ArrayMaxSize(WTH_LIMITS.maxResponses)
    @ValidateNested({ each: true })
    @Type(() => WthResponseDto)
    responses!: WthResponseDto[];
}

export class SaveWthGuideDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    opponentDeckName!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string | null;

    @IsArray()
    @ArrayMaxSize(WTH_LIMITS.maxEntries)
    @ValidateNested({ each: true })
    @Type(() => WthEntryDto)
    entries!: WthEntryDto[];
}