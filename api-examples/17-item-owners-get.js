// GET OWNERS OF DEFINED RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';
let dmsId       = '14974';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getOwners(function() {
        utils.printEnd();
    });
});


function getOwners(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/owners';
    
    axios.get(url).then(function (response) {
        
        console.log();
        console.log('    ' + response.data.owners.length + ' ownership entries found');
        console.log('    (ownerType | shortDesc | urn)');
        
        utils.printLine();
        
        for(owner of response.data.owners) {
            console.log('    > ' + owner.ownerType + ' | ' + owner.shortDesc + ' | ' + owner.urn);
        }

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });  
    
}