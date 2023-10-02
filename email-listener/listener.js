// RETRIEVE MAILS FROM IMAP ACCOUNT AND CAPTURE NOTIFICATIONS IN PLM
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Set options in file /options.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-03-03: Subject is now stored in grid tab as well
    - 2022-03-03: Uses .eml files instead of .msg files now
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-02-03: Add upload of .msg files
    - 2021-12-02: Initial Version
   -------------------------------------------------------------------------------------------------------- */



const options           = require('./options.js');
const utils             = require('../node_modules_adsk/utils.js');
const f3m               = require('../node_modules_adsk/f3m.js');
const Imap              = require('imap');
const simpleParser      = require('mailparser').simpleParser;
const fs                = require('fs');
const pathAttachments   = './attachments';
const pathMessages      = './messages';


utils.printStart([ 
    ['Account', options.mailUser ], 
    ['Workspace ID', options.workspaceId ], 
    ['Number Prefix', options.numberPrefix ], 
    ['Number Digits', options.numberDigits ], 
    ['Account', options.workspaceId ], 
    ['Mails Folder', options.folderMails ],
    ['Attachments Folder', options.folderAttachments ],
    ['Mark Mails Read', options.markMailsRead ]
]);

const imap = new Imap({
    user        : options.mailUser,
    password    : options.mailPassword,
    host        : options.mailHost,
    port        : 993,
    tls         : true
});

let mails       = [];
let files       = [];
let messages    = [];
let sectionId;


utils.createFolder(pathAttachments);
utils.createFolder(pathMessages);
utils.clearFolder(pathAttachments);


fetchMails(function() {
    f3m.login().then(function() {
        f3m.getFieldSectionId(options.workspaceId, 'SENT_BY').then(function(data) {
            sectionId = data;
            utils.print('Found ' + messages.length + ' unread mails');
            console.log();
            processMails();
        });
    });
});


function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
}

async function fetchMails(callback) {

    imap.once('ready', function() {

        utils.print('Fetching mails');

        openInbox(function(err, box) {

            if (err) throw err;
        
            imap.search([ "UNSEEN" ], function(err, results) {

                if (err) throw err;

                if(!results || !results.length) {
                    console.log("    No unread mails");
                    utils.printEnd();
                    imap.end();
                    return;
                }

                var f = imap.fetch(results, {
                    id       : '1',    
                    bodies   : '',
                    markSeen : options.markMailsRead,
                    struct   : true
                });

                f.on('message', function(msg, seqno) {

                    msg.on('body', function(stream, info) {                   

                        let buffer = '';

                        messages.push('msg-' + seqno + '.eml');

                        stream.pipe(fs.createWriteStream(pathMessages + '/msg-' + seqno + '.eml'));
                        // stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));

                        stream.on('data', function(chunk) {
                            buffer += chunk.toString('utf8');
                        });

                        stream.once('end', function() {
                            mails.push({raw : buffer});
                        });

                    });

                    msg.once('end', function() {});

                });

                f.once('error', function(err) {
                    utils.printError('Fetch error: ' + err);
                });

                f.once('end', function() {
                    utils.print('Done fetching all messages');
                    imap.end();
                    callback();
                });

            });

        });

    });
    
    imap.once('error', function(err) {
        utils.printError(err);
    });

    imap.once('end', function() {
        //console.log('Connection ended');
    });

    imap.connect();

}


function processMails() {

    if(mails.length === 0) utils.printEnd();

    else processNextMail();

}
async function processNextMail() {

    utils.printLine();

    let mail = await simpleParser(mails[mails.length - 1].raw);

    utils.print('Processing next mail');
    utils.print('Subject        : ' + mail.subject);
    utils.print('From           : ' + mail.from.text);
    utils.print('Date           : ' + mail.date);
    utils.print('Attachments    : ' + mail.attachments.length);
    console.log();

    let sender = mail.from.text;

    if(sender.indexOf(' <')) {
        sender = mail.from.text.split(' <')[0];
    } else {
        sender = mail.from.text.split('@')[0];       
    }


    let subject     = mail.headers.get('thread-topic');
    let dateString  = utils.getDateString(mail.date);
    let dateTime    = utils.getDateTimeString(mail.date);
    let excerpt     = (typeof mail.text === 'undefined') ? mail.html : mail.text;
    let message     = sender + ' ' + dateTime + '.eml';
    let attachments = '';

    files = [];
    files.attachments = [];

    if(typeof subject === 'undefined') subject = mail.subject;
    if(typeof excerpt === 'undefined') excerpt = '';

    if(subject.indexOf(options.numberPrefix) > -1) {

        let temp    = subject.split(options.numberPrefix);
        let number  = temp[1].substring(0, options.numberDigits);
        let id      = options.numberPrefix + number;

        f3m.query({
            'wsId'   : options.workspaceId,
            'limit'  : 1,
            'offset' : 0,
            'query'  : id,
            'bulk'   : false
        }).then(function(result) {

            if(result === '') {

                utils.print('> Ignoring message, does not match record');
                console.log();
                mails.splice(mails.length - 1, 1);
                messages.splice(messages.length - 1, 1);
                processMails();

            } else {

                if(excerpt.length > 500) excerpt = excerpt.substring(0, 499);

                if(mail.attachments.length > 0) {
                    attachments = '<ul>';
                    for(attachment of mail.attachments) {
                        attachments += '<li>' + attachment.filename + '</li>';
                    }
                    attachments += '</ul>';
                    files.attachments.push(attachment);
                }

                let sections = [{
                    'id' : sectionId,
                    'fields' : [
                        { 'fieldId'  : 'SUBJECT', 'value' : mail.subject },
                        { 'fieldId'  : 'SENT_BY', 'value' : mail.from.text },
                        { 'fieldId'  : 'SENT_TO', 'value' : mail.to.text },
                        { 'fieldId'  : 'LAST_MAIL_DATE', 'value' : dateString },
                        { 'fieldId'  : 'LAST_MAIL_BODY', 'value' : mail.textAsHtml },
                        { 'fieldId'  : 'LAST_MAIL_ATTACHMENTS', 'value' : attachments }
                    ]
                }];

                let row = [
                    { 'fieldId'  : 'SENT_BY', 'value' : mail.from.text },
                    { 'fieldId'  : 'SENT_TO', 'value' : mail.to.text },
                    { 'fieldId'  : 'DATE', 'value' : dateString },
                    { 'fieldId'  : 'SUBJECT', 'value' : mail.subject },
                    { 'fieldId'  : 'BODY', 'value' : excerpt },
                    { 'fieldId'  : 'ATTACHMENTS', 'value' : attachments }
                ]

                files.link = result.items[0].__self__;

                f3m.edit({
                    'link' : result.items[0].__self__, 
                    'sections' : sections
                }).then(function() {
                    utils.print('> Record update done');
                    f3m.addGridRow({
                        'link' : result.items[0].__self__, 
                        'row' : row
                    }).then(function() {
                        utils.print('> Grid update done');
                        processMessage(message);
                    });
                });

            }

        });

    } else {

        utils.print('> Ignoring message, does not match pattern');
        console.log();
        mails.splice(mails.length - 1, 1);
        messages.splice(messages.length - 1, 1);
        processMails();

    }

}

function processMessage(message) {

    fs.rename(pathMessages + '/' + messages[messages.length - 1], pathMessages + '/' + message, function() {
        
        utils.print('> Uploading message ' + message);

        f3m.uploadFile(files.link, pathMessages, message, options.folderMails).then(function() {
            utils.print('> Upload done');
            utils.deleteFile(message);
            processFiles();
        });

    });

}

function processFiles() {

    if(files.attachments.length === 0) {
        console.log();
        mails.splice(mails.length - 1, 1);
        messages.splice(messages.length - 1, 1);
        processMails();
    }
    else processNextFile();

}
function processNextFile() {

    utils.print('> Uploading attachment ' + files.attachments[0].filename);

    let attachment = files.attachments[0];
    let writeStream = fs.createWriteStream(pathAttachments + '/' + attachment.filename);

    writeStream.write(attachment.content, 'BASE64');
        
    writeStream.end();
        
    writeStream.on('finish', function(){
        f3m.uploadFile(files.link, pathAttachments, attachment.filename, options.folderAttachments).then(function() {
            files.attachments.splice(0, 1);
            processFiles();
        });
    });
        
    writeStream.on('error', function(err){
        console.log(err.stack);
    });

}