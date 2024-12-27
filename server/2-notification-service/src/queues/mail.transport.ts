import { config } from '@notifications/config';
import { IEmailLocals, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'mailTransport', 'debug');

async function sendEmail(template: string, receiverEmail: string, locals: IEmailLocalsA): Promise<void> {
  try {
    // @ email templates
    log.info('Email sent successfully');
  } catch (error) {
    log.log('error', 'NotificationService MailTransport sendEmail() method error', error);
  }
}

export { sendEmail };
