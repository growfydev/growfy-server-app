import { IsString, IsNotEmpty, Length } from 'class-validator';

export class PostTweetDto {
	@IsString()
	@IsNotEmpty()
	@Length(1, 280)
	text: string;
}

export class GetUserDetailsDto {
	@IsString()
	@IsNotEmpty()
	username: string;
}

export class OAuthCodeDto {
	@IsString()
	@IsNotEmpty()
	code: string;
}
