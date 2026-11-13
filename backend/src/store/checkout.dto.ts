import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmCheckoutDto {
    @IsString()
    @IsNotEmpty()
    sessionId!: string;
}