import path from 'path';

import { IEmailLocals, winstonLogger } from '@colson0x1/tradenexus-shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import nodemailer, { Transporter } from 'nodemailer';
import Email from 'email-templates';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'mailTransportHelper', 'debug');

async function emailTemplates(template: string, receiver: string, locals: IEmailLocals): Promise<void> {
  try {
    const smtpTransport: Transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD
      }
    });

    const email: Email = new Email({
      message: {
        from: `TradeNexus App <${config.SENDER_EMAIL}>`
      },
      // For development, send is false but if we want to send an actual
      // email, it should be set to true
      send: true,
      preview: false,
      transport: smtpTransport,
      views: {
        options: {
          extension: 'ejs'
        }
      },
      // This `juice` is just for the email templates to be able to use our
      // CSS, the CSS styles, the inline CSS styles. Because in our template
      // engine, Im using inline CSS.
      juice: true,
      juiceResources: {
        // If we're using `!important` flag in CSS, we want to preserve that.
        preserveImportant: true,
        webResources: {
          // When we build our application, we need to specify the path
          // In production, the outDir folder is going to be `/build`
          relativeTo: path.join(__dirname, '../build')
        }
      }
    });

    await email.send({
      template: path.join(__dirname, '..', 'src/emails', template),
      message: { to: receiver },
      // locals represents properties inside of our ejs email templates like
      // appLink, appIcon
      locals
    });
  } catch (error) {
    // We don't need to send the `error` here because we're going to get a
    // message inside our mail transport (`mail.transport.ts`)
    log.error(error);
  }
}

export { emailTemplates };
