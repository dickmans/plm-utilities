// GET ALL PICKLISTS DEFINED IN TENANT
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-24: Initial Version
   -------------------------------------------------------------------------------------------------------- */


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
 

utils.printStart([]);

f3m.login().then(function() {
    getSystemLogs(function() {
        utils.printEnd();
    });
});


function getSystemLogs(callback) {

   let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/rest/v1/setups/picklists';
    
   axios.get(url).then(function (response) {
      
        console.log();
        utils.print('All Picklists');
        utils.printLine();

       for(picklist of response.data.list.picklist){
           utils.print(picklist.name + ' - ' + picklist.id + ' - ' + picklist.uri.split('.autodeskplm360.net')[1]);
       }

       callback();
       
   }).catch(function (error) {
       console.log(error);    
   });

}