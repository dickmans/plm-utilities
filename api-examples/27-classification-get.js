// GET CLASSIFICATION DETAILS OF EXISTING RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-30: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId    = '57';         // Equals to Items & BOMs in default tenant
let dmsId   = '9913';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getItemDetails(function() {
        utils.printEnd();
    });
});


function getItemDetails(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    axios.get(url).then(function (response) {
       
        console.log();
        console.log('   -------------------- Classification Values --------------------');
        console.log();
        
        for(section of response.data.sections) {
            if(section.hasOwnProperty('classificationId')) {
                for(field of section.fields) {
                    console.log('   > ' + field.title + ' = ' + field.value);
                }
            }
        }

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}