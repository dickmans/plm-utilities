// ADD MULTIPLE ROWS TO GRID IN SINGLE CALL
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-06-22: Initial version
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
    addGridRows(function() {
        utils.printEnd();
    });
});


function addGridRows(callback) {
    
    console.log('    > addGridRows START');
    
    let rows = [];

    rows.push({
        'rowData' : [{
            '__self__'  : '/api/v3/workspaces/' + wsId + '/views/13/fields/TITLE',
            'value'     : 'REST API Test Entry #1',
            'title'     : 'Integer',
            'type'      : {
                'deleted'   : false,
                'link'      : '/api/v3/field-types/4',
                'title'     : 'Single Line Text',
                'urn'       : 'urn:adsk.plm:tenant.field-type:ADSKDICKMAS.4'
            }
        },{
            '__self__'  : '/api/v3/workspaces/' + wsId + '/views/13/fields/TARGET_COMPLETION_DATE',
            'value'     : '2022-01-01',
            'title'     : 'Date',
            'type'      : {
                'deleted'   : false,
                'link'      : '/api/v3/field-types/3',
                'title'     : 'Date',
                'urn'       : 'urn:adsk.plm:tenant.field-type:ADSKDICKMAS.3'
            }
        }]
    },{
        'rowData' : [{
            '__self__'  : '/api/v3/workspaces/' + wsId + '/views/13/fields/TITLE',
            'value'     : 'REST API Test Entry #2',
            'title'     : 'Integer',
            'type'      : {
                'deleted'   : false,
                'link'      : '/api/v3/field-types/4',
                'title'     : 'Single Line Text',
                'urn'       : 'urn:adsk.plm:tenant.field-type:ADSKDICKMAS.4'
            }
        },{
            '__self__'  : '/api/v3/workspaces/' + wsId + '/views/13/fields/TARGET_COMPLETION_DATE',
            'value'     : '2022-02-01',
            'title'     : 'Date',
            'type'      : {
                'deleted'   : false,
                'link'      : '/api/v3/field-types/3',
                'title'     : 'Date',
                'urn'       : 'urn:adsk.plm:tenant.field-type:ADSKDICKMAS.3'
            }
        }]
    });


    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/13/rows';
    
    axios.post(url, rows, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.grid.rows.bulk+json'
        }
    }).then(function (response) {

        console.log('    > statusCode = ' + response.status);
        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}