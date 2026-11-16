import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AskSupportDto } from './support.dto';
import { answerQuestion, type SupportReply } from './matcher';

@Controller('support')
@UseGuards(AuthGuard)
export class SupportController {
    @Post('ask')
    @HttpCode(200)
    ask(@Body() dto: AskSupportDto): SupportReply {
        return answerQuestion(dto.message);
    }
}