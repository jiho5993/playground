import { Injectable } from '@nestjs/common';
import {
  BulkEmailDestination,
  SendBulkTemplatedEmailCommand,
  SendBulkTemplatedEmailCommandInput,
  SendBulkTemplatedEmailCommandOutput,
  SESClient,
} from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly client;
  private readonly AWS_ACCESS_KEY_ID = '';
  private readonly AWS_SECRET_ACCESS_KEY = '';

  constructor() {
    this.client = new SESClient({
      region: 'ap-northeast-2',
      credentials: {
        secretAccessKey: this.AWS_SECRET_ACCESS_KEY,
        accessKeyId: this.AWS_ACCESS_KEY_ID,
      },
    });
  }

  private getSendEmailParam(
    template: string,
    destinations: BulkEmailDestination[],
    defaultData: Record<string, string>,
  ): SendBulkTemplatedEmailCommandInput {
    return {
      Source: '박지호 <jiho5993@gmail.com>',
      Template: template,
      Destinations: destinations,
      DefaultTemplateData: JSON.stringify(defaultData),
    };
  }

  async sendBulkEmail(emails: string[], data: Record<string, any>[]): Promise<SendBulkTemplatedEmailCommandOutput> {
    const defaultData = { name: '누구세요?', position: '뭐하는 사람이에요?' };

    const destinations: BulkEmailDestination[] = [];
    for (let i = 0; i < emails.length; i++) {
      destinations.push({
        Destination: {
          ToAddresses: [emails[i]],
        },
        ReplacementTemplateData: JSON.stringify(data[i]),
      });
    }

    const options = this.getSendEmailParam('OCTET_JJANG', destinations, defaultData);

    return await this.client.send(new SendBulkTemplatedEmailCommand(options));
  }
}
