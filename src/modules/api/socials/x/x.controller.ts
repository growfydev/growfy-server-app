import { Controller, Get, Query, Redirect, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { XService } from './x.service';
import { OAuthCodeDto, PostTweetDto, GetUserDetailsDto } from './tweet.dto';

@Controller('x')
export class XController {
  constructor(private readonly xService: XService) {}

  @Get('authorize')
  @Redirect()
  authorize() {
    const url = this.xService.getAuthorizationUrl();
    return { url };
  }

  @Get('callback')
  async callback(@Query() query: OAuthCodeDto) {
    const { code } = query;

    try {
      const accessToken = await this.xService.getAccessToken(code);
      return { accessToken };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('tweet')
  async tweet(@Body() postTweetDto: PostTweetDto, @Query('accessToken') accessToken: string) {
    const { text } = postTweetDto;

    try {
      const result = await this.xService.postTweet(text, accessToken);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
