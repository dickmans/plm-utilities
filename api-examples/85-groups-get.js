// GET LIST OF ALL GROUPS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([]);

f3m.login().then(function() {
    getGroups(function() {
        utils.printEnd();
    });
});


// Get all groups
function getGroups(callback) {    

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/groups';
    
    axios.get(url).then(function (response) {
       
        console.log(response.data);
        console.log();
        console.log(' shortName / urn');
        
        for(group of response.data.groups) {
            console.log(' > ' + group.shortName + ' | ' + group.urn);
        }
        
        console.log();

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });

}