import { IsEmail, IsInt, IsNotEmpty } from 'class-validator';

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsInt()
    @IsNotEmpty()
    profileId: number;
}
