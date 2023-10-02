// EXTRACT REPORT DATA
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-11-29: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let reportId  = '361';       // ID of report to run in PLM (Quality Inspection Results in default tenant)


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Report ID', reportId] ]);

f3m.login().then(function() {
    requestReport(function(data) {
        utils.printEnd();
    });
});



// Request Report
function requestReport(callback) {
    
    console.log('    Requesting report ' + reportId);

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/rest/v1/reports/' + reportId;

    axios.get(url).then(function (response) {
        
// console.log(response.data);

        console.log();
        console.log('    Report Name        : ' + response.data.reportDefinition.name);
        console.log('    Report Description : ' + response.data.reportDefinition.description);
        console.log();

        console.log(response.data.reportResult);

        callback();

   }).catch(function (error) {

        console.log('Error getting report data');
        console.log(error);
    
    });
    
}