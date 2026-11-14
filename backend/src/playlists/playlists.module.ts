import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { AuthModule } from '../auth/auth.module';
import { ConnectModule } from '../connect/connect.module';

@Module({
    imports: [AuthModule, ConnectModule],
    controllers: [PlaylistsController],
    providers: [PlaylistsService],
})
export class PlaylistsModule {}