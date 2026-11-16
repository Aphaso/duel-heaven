import { IsString, MaxLength } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from './matcher';

export class AskSupportDto {
    @IsString()
    @MaxLength(MESSAGE_MAX_LENGTH)
    message!: string;
}