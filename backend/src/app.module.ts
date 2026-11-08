import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrsimaModule } from './prisma/prisma.module';
import { CardsModule } from './cards/cards.module';
import { UsersModule } from './users/users.module';
import { DecksModule } from './decks/decks.module';
import { SidePatternsModule } from './side-patterns/side-patterns.module';
import { WthModule } from './wth/wth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrsimaModule,
    CardsModule,
    UsersModule,
    DecksModule,
    SidePatternsModule,
    WthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
