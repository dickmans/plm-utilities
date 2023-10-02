// UPDATE DETAILS OF A FIRST MANAGED ITEMS ENTRY OF DEFINED CHANGE ORDER
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-07-05: Update as former version failed immediately
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-12-10: Initial version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '84';         // Equals to workspace Change Orders in default tenant
let dmsId       = '14245';      // ID of Change Order to be updated


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getManagedItems(function(data) {
        updateManagedItem(data, function() {
            utils.printEnd();
        });
    });
});


function getManagedItems(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/11';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.affectedItems.length + ' affected items');
        console.log();
        console.log();
        console.log('    Available Properties');
        
        utils.printLine();

        for (var key in response.data.affectedItems[0]) {
            console.log('    ' + key);
        }
        
        console.log();
        console.log();
        console.log('    List of affected items');
        
        utils.printLine();
        
        for(affectedItem of response.data.affectedItems) {
            
            console.log('    ' + affectedItem.item.title);
            
        }
        
        callback(response.data);
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}

function updateManagedItem(data, callback) {

    let affectedItem = data.affectedItems[0];
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + affectedItem.__self__;
    
    let params = {
        'linkedFields': [
            {
                "value": "HQ",
                "__self__": "/api/v3/workspaces/84/views/11/fields/CHANGE_PERFORMED",
                // "title": "Change performed",
                // "type": {
                //     "link": "/api/v3/field-types/4",
                //     "urn": "urn:adsk.plm:tenant.field-type:ADSKTSESVEND.4",
                //     "title": "Einzeiliger Text",
                //     "deleted": false
                // },
                // "urn": "urn:adsk.plm:tenant.workspace.view.field:ADSKTSESVEND.84.11.CHANGE_PERFORMED"
            }
        ],
        // 'availableTransitions': "/api/v3/workspaces/84/items/14245/views/11/affected-items/15631/transitions",
        // 'effectivityDate': null,
        // 'fromRelease': "",
        // 'item': {
        //     "link": "/api/v3/workspaces/57/items/15631",
        //     "urn": "urn:adsk.plm:tenant.workspace.item:ADSKTSESVEND.57.15631",
        //     "title": "000117 - JE001204 - Jet Engine Model",
        //     "deleted": false,
        //     "version": "[REV:w]"
        // },
        'targetTransition': {
            "link": "/api/v3/workflows/9223372036854775807/transitions/6",
            // "title": "To Production"
        },
        // 'toRelease': "A",
        // 'transitions' : [
        //     {
        //         "incrementVersion": true,
        //         "incrementRelease": true,
        //         "workspaces": [],
        //         "quickReleaseWorkspaces": [],
        //         "overrideTargetRevision": "AUTO",
        //         "id": 6,
        //         "name": "To Production",
        //         "fromState": {
        //             "link": "/api/v3/workflows/9223372036854775807/states/0",
        //             "urn": "urn:adsk.plm:tenant.workflow.state:ADSKTSESVEND.9223372036854775807.0",
        //             "title": "Unreleased",
        //             "deleted": false
        //         },
        //         "toState": {
        //             "link": "/api/v3/workflows/9223372036854775807/states/2",
        //             "urn": "urn:adsk.plm:tenant.workflow.state:ADSKTSESVEND.9223372036854775807.2",
        //             "title": "Production",
        //             "deleted": false
        //         },
        //         "obsolete": false,
        //         "effectivityWritable": true,
        //         "__self__": "/api/v3/workflows/9223372036854775807/transitions/6",
        //         "title": "To Production",
        //         "link": "/api/v3/workflows/9223372036854775807/transitions/6"
        //     },
        //     {
        //         "incrementVersion": true,
        //         "incrementRelease": false,
        //         "workspaces": [],
        //         "quickReleaseWorkspaces": [],
        //         "overrideTargetRevision": "AUTO",
        //         "id": 1,
        //         "name": "To Pre-Release",
        //         "fromState": {
        //             "link": "/api/v3/workflows/9223372036854775807/states/0",
        //             "urn": "urn:adsk.plm:tenant.workflow.state:ADSKTSESVEND.9223372036854775807.0",
        //             "title": "Unreleased",
        //             "deleted": false
        //         },
        //         "toState": {
        //             "link": "/api/v3/workflows/9223372036854775807/states/1",
        //             "urn": "urn:adsk.plm:tenant.workflow.state:ADSKTSESVEND.9223372036854775807.1",
        //             "title": "Pre-Release",
        //             "deleted": false
        //         },
        //         "obsolete": false,
        //         "effectivityWritable": false,
        //         "__self__": "/api/v3/workflows/9223372036854775807/transitions/1",
        //         "title": "To Pre-Release",
        //         "link": "/api/v3/workflows/9223372036854775807/transitions/1"
        //     }
        // ],
        // 'type': "REVISION_CONTROLLED",
        // 'urn': "urn:adsk.plm:tenant.workspace.item.view.affected-item:ADSKTSESVEND.84.14245.11.15631",
        // '__self__': "/api/v3/workspaces/84/items/14245/views/11/affected-items/15631"
    }

    axios.put(url, params).then(function (response) {
        callback();
    }).catch(function (error) {
        console.log(error.message);
    });
    
}