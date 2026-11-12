import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
    @IsString()
    @IsNotEmpty()
    credential!: string;
}

export class GoogleCompleteDto {
    @IsString()
    @IsNotEmpty()
    signupToken!: string;

    @IsString()
    @IsNotEmpty()
    username!: string;
}