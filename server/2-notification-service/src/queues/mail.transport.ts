import { config } from '@notifications/config';
import { IEmailLocals, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { emailTemplates } from '@notifications/helpers';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'mailTransport', 'debug');

async function sendEmail(template: string, receiverEmail: string, locals: IEmailLocals): Promise<void> {
  try {
    // @ email templates
    emailTemplates(template, receiverEmail, locals);
    log.info('Email sent successfully');
  } catch (error) {
    log.log('error', 'NotificationService MailTransport sendEmail() method error', error);
  }
}

export { sendEmail };
