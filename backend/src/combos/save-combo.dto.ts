import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { COMBO_LIMITS } from './combo-engine';

export class ComboCardDto {
    @IsInt()
    @Min(1)
    cardId!: number;

    @IsIn(['MAIN', 'EXTRA'])
    section!: 'MAIN' | 'EXTRA';

    @IsInt()
    @Min(1)
    @Max(3)
    quantity!: number;
}

export class SaveComboDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string | null;

    @IsArray()
    @ArrayMaxSize(75)
    @ValidateNested({ each: true })
    @Type(() => ComboCardDto)
    cards!: ComboCardDto[];

    @IsArray()
    @ArrayMaxSize(10)
    @IsInt({ each: true })
    startingHand!: number[];

    /** Checked by the engine when using parseStep, not by class-validator */
    @IsArray()
    @ArrayMaxSize(COMBO_LIMITS.maxSteps)
    steps!: unknown[];
}