// DETERMINE USERS NOT HAVING 2FA ENABLED
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options/get-non-2fa-users.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-01-20: Initial version
   -------------------------------------------------------------------------------------------------------- */


const options   = require('./options/get-non-2fa-users.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([ ['Domains Excluded', options.domainsExcluded] ]);

let countExcluded   = 0;
let count2FA        = 0;
let countNon2FA     = 0;
let offset          = 0;
let limit           = 10;
let requestCount    = 5;

f3m.login().then(function() {
    searchUsers();
});


function searchUsers() {

    f3m.getUsers({
        'offset' : offset,
        'limit' : limit,
        'includeTenantAdmin' : false,
        'mappedOnly' : false,
        'activeOnly' : true,
    }).then(function(data) {
        offset += limit;
        console.log();
        utils.print('Found next ' + data.items.length + ' users');
        let hasNext = data.hasOwnProperty('next');
        if(data.items.length === 0) {
            printEnd();
        } else {
            utils.printLine();
            processNextUsers(data.items, hasNext);
        }
    });

}


function printEnd() {

    console.log();
    console.log();
    utils.print('SUMMARY');
    utils.printLine();
    utils.print('Users having 2FA enabled     : ' + count2FA);
    utils.print('Users not having 2FA enabled : ' + countNon2FA);
    utils.print('Users excluded               : ' + countExcluded);
    utils.printEnd();

}

function processNextUsers(users, hasNext) {

    let limit = (users.length < requestCount) ? users.length : requestCount;
    let requests = [];

    for(let i = 0; i < limit; i++) {
        requests.push(f3m.getUserDetails(users[i].__self__));
    }

    if(requests.length === 0) {
        searchUsers();
    } else {
        Promise.all(requests).then(function(result) {

            for(user of result) {

                let mailDomain = user.email.split('@')[1];

                if(options.domainsExcluded.indexOf(mailDomain) > -1) {
                    countExcluded++;
                } else if(user.twoFaEnabled) {
                    count2FA++; 
                } else {
                    let organization = (user.organization === '') ? '' : ' from ' + user.organization;
                    countNon2FA++;
                    utils.print(user.displayName + ' (' + user.email + ')' + organization);
                }
            }

            users.splice(0, limit);
            if(users.length === 0 && hasNext === false) printEnd();
            else processNextUsers(users, hasNext);
        });
    }

}