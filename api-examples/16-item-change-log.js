// EXTRACT CHANGE LOG OF DEFINED RECORD
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
let dmsId       = '14849';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getChangeLog(function() {
        utils.printEnd();
    });
});


function getChangeLog(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/logs?desc=timeStamp&limit=100&offset=0';
    
    axios.get(url).then(function (response) {
        
        console.log();
        console.log('    ' + response.data.items.length + ' log entries found');
        
        utils.printLine();
        
        for(item of response.data.items) {
            console.log(item);
        }

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });  
    
}