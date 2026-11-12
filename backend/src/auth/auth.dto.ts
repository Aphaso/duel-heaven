import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid Email' })
    @MaxLength(254)
    email!: string;

    @IsString()
    @MinLength(8, { message: 'The password must be at least 8 characters long' })
    @MaxLength(128)
    password!: string;

    @IsString()
    @MaxLength(50)
    username!: string;

    @IsString()
    @MinLength(1, { message: 'The displayed name is mandatory' })
    @MaxLength(50)
    displayName!: string;
}

export class LoginDto {
    @IsEmail({}, { message: 'Email non valida' })
    @MaxLength(254)
    email!: string;

    // The password's minimum length is checked only on registration.
    // On login we just need it to not be empty, since the check is done by confronting the hash.
    @IsString()
    @MinLength(1)
    @MaxLength(128)
    password!: string;
}

/** For a logged-in user: used to choose the username (e.g. after Google) or change the names. */
export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    username?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    displayName?: string;
}