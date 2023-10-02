// UPDDATE GIVEN USER STATUS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


//Options
let user   = 'eric@fusion.rocks';         // mail address of user to update
let status = 'Deleted';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
 

utils.printStart([ ['User to update', user], ['New Status', status] ]);


f3m.login().then(function() {
    getUsers(function(users) {
        setUserStatus(users, function() {
            utils.printEnd();
        });
    });
});


// Get all users of tenant
function getUsers(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users?activeOnly=true';
    
    axios.defaults.headers.common['Accept'] = 'application/vnd.autodesk.plm.users.bulk+json';

    axios.get(url).then(function (response) {
        callback(response.data.items);
    }).catch(function (error) {
        console.log(error.message);
    });
    
}


// Toggle user status
function setUserStatus(users, callback) {

    let userId = null;

    for(userData of users) {
        if(userData.email === user) {
            userId = userData.userId;
        }
    }

    if(userId === null) {

        console.log('    > Could not find user ' + user);
        callback();

    } else {

        console.log('    > Updating user with id ' + userId);

        let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users/' + userId;

        axios.patch(url, [{
            'op'    : 'replace',
            'path'  : '/userStatus',
            'value' : status
        }], {
            'headers' : {
                'Accept': 'application/json',
                'Content-Type': 'application/json-patch+json'
            }
        }).then(function (response) {
            if(response.status === 204)
                console.log('    > setUserStatus SUCCESS');
            callback();
        }).catch(function (error) {
            console.log(error);
            console.log(error.message);
        });

    }
    
}