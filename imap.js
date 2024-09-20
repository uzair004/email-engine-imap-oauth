const { ImapFlow } = require('imapflow');
require('dotenv').config();

const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })

async function main(mailbox) {

    await connectClient()

    const mailboxLock = await connectMailbox('INBOX');

    if (!mailboxLock) {
        console.log(`Failed to aquire or connect to ${mailbox} `)
        return
    }

    await fetchMessages()

    // list subjects for all messages
    for await (let message of client.fetch('1*', { envelope: true }))
        console.log(`${message.uid}: ${message.envelope.subject}`);

    await logoutClient()
}

async function connectClient() {
    return client.connect()
}

async function connectMailbox(mailbox) {
    let lock
    try {
        lock = await client.getMailboxLock('INBOX');
    } finally {
        lock.release()
    }

    if (!lock) return null

    return lock
}


async function fetchMessages() {
    const message = await client.fetchOne(client.mailbox.exists, { source: true });
    console.log(message.source.toString());
    return message
}


async function logoutClient() {
    return client.logout();
}


main().catch(err => console.error(err));


