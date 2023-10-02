// DISABLE ALL USERS IN A TENANT
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Set options in file /options/disable-all-users.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-10-29: Initial version
   -------------------------------------------------------------------------------------------------------- */


const options   = require('./options/disable-all-users.js');
const settings  = require("../settings.js");
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([ ['Users to keep', options.usersToKeepActive] ]);

let count        = 0;
let requestCount = 5;
let users        = [];

if(options.usersToKeepActive === null || options.usersToKeepActive.length === 0) {
    utils.print('Cannot proceed as there are no users defined to keep');
    utils.printEnd();
} else {
    f3m.login().then(function() {
        searchUsers();
    });
}


function searchUsers() {

    users = [];

    f3m.getUsers({
        'limit'                 : 100,
        'includeTenantAdmin'    : false,
        'mappedOnly'            : false,
        'activeOnly'            : true,
    }).then(function(data) {
        console.log();
        utils.print('Found ' + data.items.length + ' users');
        for(user of data.items) {
            if((settings.user !== user.email) && (options.usersToKeepActive.indexOf(user.email) < 0)) {
                if(user.userStatus !== 'Deleted')
                    users.push(user);
            } else {
                utils.print('Skipping user ' + user.email);
            }
        }
        if(users.length === 0) utils.printEnd();
        else {
            utils.printLine();
            processNextUsers();
        }
    });

}


function processNextUsers() {

    let limit = (users.length < requestCount) ? users.length : requestCount;
    let requests = [];

    for(let i = 0; i < limit; i++) {
        requests.push(processNextUser(users[i]));
    }

    if(requests.length === 0) {
        searchUsers();
    } else {
        Promise.all(requests).then(function() {
            users.splice(0, limit);
            processNextUsers();
        });
    }

}


function processNextUser(user) {

    console.log('    Processing user #' + (++count) + ' ' + user.displayName);

    return new Promise(function(resolve, reject) {

        let params = {
            'userId'    : user.userId,
            'status'    : 'Deleted'
        }

        f3m.setUserStatus(params).then(function() { return resolve(); });

    });
    
}