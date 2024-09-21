import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import 'dotenv/config'

const client = new ImapFlow({ logger: false, host: 'imap.gmail.com', port: 993, secure: true, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })

async function main(mailbox = 'INBOX') {
  try {
    await connectClient();
    const lock = await connectMailbox(mailbox);
    
    if (!lock) {
      console.log(`Failed to acquire or connect to ${mailbox}`);
      return;
    }
    
    try {
      await fetchAndParseMessages();
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await logoutClient();
  }
}

async function connectClient() {
    return client.connect()
}

async function connectMailbox(mailbox) {
  try {
    const lock = await client.getMailboxLock(mailbox);
    console.log(`Connected to mailbox: ${mailbox}`);
    return lock;
  } catch (error) {
    console.error(`Error connecting to mailbox ${mailbox}:`, error);
    return null;
  }
}


async function fetchAndParseMessages() {
  // Fetch the last 5 messages
  for await (let message of client.fetch('1:1', { source: true, envelope: true })) {
    console.log(`Processing message ${message.uid}: ${message.envelope.subject}`);
    
    try {
       const parsed = await simpleParser(message.source);
      console.log('Parsed message:', {
        subject: parsed.subject,
        from: parsed.from?.value,
        to: parsed.to?.value,
        text: parsed.text,
        html: parsed.html ? 'HTML content available' : 'No HTML content'
      });
      
      // You can process attachments here if needed
      if (parsed.attachments.length > 0) {
        console.log('Attachments:', parsed.attachments.map(att => att.filename));
      }
    } catch (error) {
      console.error(`Error parsing message ${message.uid}:`, error);
    }
  }
}


async function logoutClient() {
    return client.logout();
}


main().catch(err => console.error(err));


