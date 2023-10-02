// GET ALL VALUES OF DEFINED PICKLIST
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-24: Initial Version
   -------------------------------------------------------------------------------------------------------- */


// Options
let picklistName = 'Change Reason Codes';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
 

utils.printStart([ ['Picklist Name', picklistName] ]);

f3m.login().then(function() {
    getSystemLogs(function(picklist) {
        getPicklistValues(picklist, function() {
            utils.printEnd();
        })
    });
});


function getSystemLogs(callback) {

   let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/rest/v1/setups/picklists';
    
   axios.get(url).then(function (response) {
      
        let result = null;

       for(picklist of response.data.list.picklist){
            if(picklist.name === picklistName) {
                result = picklist; 
                break;
            }
       }

       callback(result);
       
   }).catch(function (error) {
       console.log(error);    
   });

}

function getPicklistValues(picklist, callback) {

    if(picklist === null) {

        utils.print('Could not find picklist ' + picklistName);
        callback();

    } else {

        axios.get(picklist.uri).then(function (response) {
            console.log(response.data);
            callback();
        }).catch(function (error) {
            console.log(error);    
        });

    
    }
 
 }