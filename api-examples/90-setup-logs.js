// GET ENTRIES OF SETUP LOG
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


// Options
var limit = 20;


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
 

utils.printStart([ ['Limit', limit] ]);

f3m.login().then(function() {
    getSetupLogs(function() {
        utils.printEnd();
    });
});


// Get log entries
function getSetupLogs(callback) {

   let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/tenants/' + settings.tenant.toUpperCase() + "/setup-logs?limit=" + limit;
    
   axios.get(url).then(function (response) {
      
       console.log(response.data);
       console.log();

       callback();
       
   }).catch(function (error) {
       console.log(error);    
   });

}