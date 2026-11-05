import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateDeckDto {
    // The name can be left out, but it can never be null since it is a required column.
    // IsOptional would also let null through, so we skip validation only for undefined.
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    // null is meant as "remove the archetype"
    @IsOptional()
    @IsString()
    @MaxLength(100)
    archetype?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}