import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class ReorderPlaylistsDto {
    // All of the user's playlists in the new order
    @IsArray()
    @ArrayMaxSize(1000)
    @ArrayUnique()
    @IsString({ each: true })
    ids!: string[];
}