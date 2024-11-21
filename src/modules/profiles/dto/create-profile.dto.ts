import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProfileDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
