// GET ROWS IN GRID OF DEFINED RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId    = '84';      // Equals to workspace Change Orders in default tenant
let dmsId   = '11012';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getGridRows(function() {
        utils.printEnd();
    });
});


function getGridRows(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/13/rows';
    
    axios.get(url).then(function (response) {

        for(row of response.data.rows) { console.log(row); }

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}