// GET LIST OF ALL ACTIVE USERS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-01-20: Retrieve additional details by using dedicated accept header
    - 2022-01-20: Make use of utils for simplification
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([]);

f3m.login().then(function() {
    getUsers(function() {
        utils.printEnd();
    });
});


function getUsers(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users';
    
    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.users.bulk+json'
        }
    }).then(function (response) {

        console.log();
        console.log('    LIST OF USERS');
        console.log('    (displayName / __self__ / urn  / userActive)');
        utils.printLine();
        
        
        for(user of response.data.items) {
            console.log('    > ' + user.displayName + ' | ' + user.__self__ + ' | ' + user.urn + ' | ' + user.userActive);
        }

        if(response.data.items.length > 0) {
            console.log();
            console.log();
            console.log('    DETAILS OF FIRST USER ENTRY');
            utils.printLine();
            console.log(response.data.items[0]);

        }


        callback();

    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}