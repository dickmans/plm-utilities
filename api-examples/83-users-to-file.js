// SAVE LIST OF ACTIVE USERS IN FILE
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
    - 2020-11-06: Initial version
   -------------------------------------------------------------------------------------------------------- */


// Options
let fileName = '../out/users.txt';


const axios     = require('axios');
const fs        = require('fs');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Filename', fileName] ]);

f3m.login().then(function() {
    getUsers(function() {
        utils.printEnd();     
    });
});


// GET ALL USERS AND SAVE OUTPUT TO FILE
function getUsers(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users?limit=100';
    
    axios.defaults.headers.common['Accept'] = 'application/vnd.autodesk.plm.users.bulk+json';

    axios.get(url).then(function (response) {
        
        for(user of response.data.items) {
            let userData = user.displayName + '|' + user.email
            fs.appendFileSync(fileName, userData + '\r\n');
            console.log('    > ' + userData);
        }
        
        if(response.data.hasOwnProperty('next')) {
           getUsers(response.data.next.link);
        } else {
            console.log(' ');
            console.log('    Output saved to ' + fileName);
            callback();
        }
        
    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}