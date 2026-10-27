export class CreateCardDto {
    id!: number;
    name!: string;
    type!: string;
    desc!: string;
    frameType?: string;
    atk?: number;
    def?: number;
    level?: number;
    race?: string;
    attribute?: string;
    archetype?: string;
}