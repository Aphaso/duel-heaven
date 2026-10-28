import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDeckDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    archetype?: string;
    
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}