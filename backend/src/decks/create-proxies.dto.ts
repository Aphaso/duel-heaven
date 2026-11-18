import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class ProxyRowDto {
    @IsInt()
    @Min(1)
    cardId!: number;

    @IsInt()
    @Min(1)
    @Max(99)
    quantity!: number;
}

export class CreateProxiesDto {
    // One row per card, in printing order
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique((row: ProxyRowDto) => row.cardId, { message: 'Duplicated in the request'})
    @ValidateNested({ each: true })
    @Type(() => ProxyRowDto)
    cards!: ProxyRowDto[];
}