import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CardsModule } from './cards/cards.module';
import { UsersModule } from './users/users.module';
import { DecksModule } from './decks/decks.module';
import { SidePatternsModule } from './side-patterns/side-patterns.module';
import { WthModule } from './wth/wth.module';
import { CombosModule } from './combos/combos.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ConnectModule } from './connect/connect.module';
import { SupportModule } from './support/support.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CardsModule,
    UsersModule,
    DecksModule,
    SidePatternsModule,
    WthModule,
    CombosModule,
    PlaylistsModule,
    AuthModule,
    StoreModule,
    PurchasesModule,
    ConnectModule,
    SupportModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
