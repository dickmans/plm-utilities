// ADD NEW USER TO TENANT AND ASSIGN GROUPS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-02-03: Added setting for license type, allowing to omit this settting for Adsk accounts
    - 2022-02-02: Alignment with other scripts to utilize utils.js
    - 2021-09-13: Replaced library 'querystring'
    - 2021-03-26: Switch to Axios
    - 2020-05-20: Initial version
   -------------------------------------------------------------------------------------------------------- */


// Options
let user    = 'mike@fusion.rocks';  // Mail address of the Autodesk Account to add to the tenant
let license = 'S'                 // P: Participant, S: Professional, set to blank if tenant is using Autodesk Account Management


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['New User', user] ]);

f3m.login().then(function() {
    addUser(function() {
        utils.printEnd();
    });
});


function addUser(callback) {

    console.log('    > adding user');
    
    let url  = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users';
    
    let params = {
        'email'         : user,
        'thumbnailPref' : 'Yes',
        'uomPref'       : 'Metric',
        'timezone'      : 'Etc/GMT+1'
    }

    if(license !== '') {
        params.licenseType = {
            'licenseCode': license
        }
    }

    axios.post(url, params).then(function (response) {
        
        console.log('    > user added successfully (' + response.headers.location + ')');
        callback();
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}