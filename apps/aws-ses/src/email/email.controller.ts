import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendBulkEmailOctetJjang(@Body() body: Record<string, any>) {
    const { emails, data } = body;
    return await this.emailService.sendBulkEmail(emails, data);
  }
}
