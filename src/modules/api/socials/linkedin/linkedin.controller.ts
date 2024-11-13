import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { LinkedInAuthGuard } from './linkedin.guard';

@Controller('linkedin')
export class LinkedInController {
    @Get()
    @UseGuards(LinkedInAuthGuard)
    async linkedinAuth(@Req() req: Request) {
        // Initiates the OAuth flow, LinkedInAuthGuard will handle redirection.
    }

    @Get('callback')
    @UseGuards(LinkedInAuthGuard)
    async linkedinAuthCallback(@Req() req: Request, @Res() res: Response) {
        res.redirect('/dashboard'); // Redirect user after successful authentication
    }
}
