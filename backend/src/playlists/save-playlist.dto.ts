import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}