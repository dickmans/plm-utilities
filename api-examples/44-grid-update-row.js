// UPDATE ROW IN GRID OF DEFINED RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2021-01-28: Using axios library for requests
    - 2021-01-28: Remove dependency on request-promise
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
    getGridRows(function(rows) {
        updateGridRow(rows, function() {
            utils.printEnd();
        });
    });
});


function getGridRows(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/13/rows';
    
    axios.get(url).then(function (response) {
        console.log('    > Found ' + response.data.rows.length + ' grid rows');
        callback(response.data.rows);
    }).catch(function (error) {
        console.log(error.message);
    });
    
}

function updateGridRow(rows, callback) {
    
    console.log('    > updateGridRow START');
    console.log();

    if(rows !== null) {

        let rowId   = rows[0].rowData[0].value;
        let url     = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/13/rows/'+ rowId;
        let rowData = [];

        updateSingleLineText(rowData, 'TITLE', 'Live long and prosper');

        axios.put(url, {
            'rowData': rowData
        }).then(function (response) {
            console.log('    Status code : ' + response.status); 
            callback();
        }).catch(function (error) {
            console.log('    ERROR : ' + error.message);
            callback();
        });


    } else {
        callback();
    }
    
}

function updateSingleLineText(rowData, fieldId, value) {
    
    rowData.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/views/13/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.view.field:' + settings.tenant.toUpperCase() + '.' + wsId + '.13.' + fieldId,
        'title'     : 'Single Line Text',
        'value'     : value,
        'type'      : {
            'link'      : '/api/v3/field-types/4',
            'urn'       : 'urn:adsk.plm:tenant.field-type:' + settings.tenant.toUpperCase() + '.4',
            'title'     : 'Single Line Text',
            'deleted'   : false
        }
    });
    
}