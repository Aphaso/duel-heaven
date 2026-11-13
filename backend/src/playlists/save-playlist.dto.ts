import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional, IsString, IsBoolean, IsInt, Max, Min, MaxLength, MinLength } from 'class-validator';

export class SavePlaylistDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string | null;

    /** Combos in playing order */
    @IsArray()
    @ArrayMaxSize(100)
    @ArrayUnique({ message: 'Duplicated Combo in the Playlist' })
    @IsString({ each: true })
    comboIds!: string[];

    @IsOptional()
    @IsBoolean()
    isForSale?: boolean;

    @IsOptional()
    @IsInt()
    @Min(50) // 0.50 €, minimum accepted Euro value by Stripe
    @Max(50_000) // 500.00 €
    priceCents?: number | null;
}