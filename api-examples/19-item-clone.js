// CLONE EXISTING RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-03-10: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let newTitle    = 'Latest Template'; // (unique) title of new record


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
const FormData  = require('../node_modules/form-data');


utils.printStart([ ['New Title', newTitle] ]);

f3m.login().then(function() {
    cloneItem(function() {
        utils.printEnd();
    });
});


function cloneItem(callback) {

    let wsId = 94;
    let url  = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items';

    let params = {
        'sourceItemId' : '8932',
        'item': {
           'sections' : [{
                'link':'/api/v3/workspaces/' + wsId + '/sections/450',
                'fields':[{
                    '__self__':'/api/v3/workspaces/' + wsId + '/views/1/fields/TITLE',
                    'value':newTitle,
                    'urn':'urn:adsk.plm:tenant.workspace.view.field:ADSKTSESVEND.' + wsId + '.1.TITLE',
                    'fieldMetadata':null,
                    'dataTypeId':4,
                    'title':'Title'
                },{
                    '__self__':'/api/v3/workspaces/' + wsId + '/views/1/fields/DESCRIPTION',
                    'value':'<p>Checklist for new product developments</p>',
                    'urn':'urn:adsk.plm:tenant.workspace.view.field:ADSKTSESVEND.' + wsId + '.1.DESCRIPTION',
                    'fieldMetadata':null,
                    'dataTypeId':8,
                    'title':'Description'
                }]
            }]
        },
        'cloneOptions'      : [ 'ITEM_DETAILS', 'PART_GRID', 'PART_ATTACHMENTS' ],
        'hasPivotFields'    : false
     };

    let formData = new FormData();

    formData.append('itemDetail', JSON.stringify(params), {
        filename    : 'blob',
        contentType : 'application/json'
    });

    let headers = formData.getHeaders();
        headers['accept'] = 'application/vnd.autodesk.plm.meta+json';

    console.log(headers);

    axios.post(url, formData, {
        headers : headers
    }).then(function (response) {
        console.log('    Clone completed successfully');
        console.log('    ' + response.headers.location);
        console.log();
        callback();
    }).catch(function (error) {
        console.log(error);
    });

}