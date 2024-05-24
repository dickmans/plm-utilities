// ADD NEW USERS TO TENANT AND ASSIGN GROUPS (ALSO TO EXISTING USERS)
// Before using this program, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Provide list of users and given groups in file /data/add-users.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-05-24: Added capability to add existing users to groups as well
    - 2023-04-12: Adjusted to match new response of groups endpoint
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-03-26: Switch to Axios and manage data in external file
    - 2020-05-20: Initial version
   -------------------------------------------------------------------------------------------------------- */

const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const data      = require('./data/add-users.js');


let users  = [];
let groups = [];
let index  = 0;

utils.printStart([ ['User count', data.users.length] ]);

f3m.login().then(function() {
    utils.print('Getting all groups');
    f3m.getUsers().then(function(response) {
        users = response.items;
        utils.print('Found ' + users.length + ' users in tenant');
        f3m.getGroups().then(function(response) {
            groups = response.items;
            utils.print('Found ' + groups.length + ' groups in tenant');
            addUsers();
        });
    });
});


function addUsers() {
    if(index < data.users.length) {
        addUser();
    } else {
        utils.printEnd();
    }
}


function addUser() {
    
    let user = data.users[index++];
    let link = '';
    let urns = [];
     
    console.log();
    utils.print('ADDING USER #' + (index));
    utils.printLine();
    utils.print('e-Mail       : ' + user[0]);
    utils.print('Groups       : ' + user[1]);

    for(let account of users) {
        if(account.email === user[0]) {
            link = 'https://' + utils.tenant + '.autodeskplm360.net' + account.__self__;
            break;
        }
    }

    for(let group of groups) {
        if(user[1].indexOf(group.shortName) > -1) {
            urns.push(group.urn);
        }
    }

    if(urns.length === 0) {

        console.log();
        utils.print('Did not find any matching group for user ' + user[0]);
        utils.print('These groupd were defined for this user : ' + user[1]);
        utils.print('This user will be skipped');
        addUsers();

    } else if(link !== '') {

        utils.print('Action       : Assigning existing user to ' + urns.length + ' groups');

        f3m.assignGroups(link, urns).then(function() {
            addUsers();
        });

    } else {
    
        utils.print('Action       : Creating new user account');

        f3m.addUser({
            'email'      : user[0],
            'uom'        : data.uom,
            'timezone'   : data.timezone,
            'licenseCode': 'S'   // P: Participant, S: Professional
        }).then(function(response) {

            if(response === 'error') {
                console.log();
                utils.print('Error occoured while adding user ' + user[0]);
                console.log();
            } else  {
                f3m.assignGroups(response, urns).then(function() {
                    addUsers();
                });
            }

        });

    }
    
}