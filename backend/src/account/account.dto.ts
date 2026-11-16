import { IsString, MaxLength } from 'class-validator';

export class DeleteAccountDto {
    @IsString()
    @MaxLength(320)
    confirmation!: string;
}