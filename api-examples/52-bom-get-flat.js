// GET FLAT BOM USING FIRST BOM VIEW DEFINITION
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId    = '57';           // Equals to workspace Items & BOMs in default tenant
let dmsId   = '12631';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getBOMViews(function(viewId) {
        getBOM(viewId, function() {
            utils.printEnd();
        });
    });
});


function getBOMViews(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/views/5';

    axios.get(url).then(function (response) {

        console.log();

        for(view of response.data.bomViews) {
            console.log('    - BOM View found : ' + view.link);
        } 

        console.log();
        
        var bomView = response.data.bomViews[0].link.split('/');
        var viewId  = bomView[bomView.length - 1];

        callback(viewId);

    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}

function getBOM(viewId, callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/bom-items?depth=10&effectiveDate=2020-06-25&revisionBias=release&rootId=' + dmsId + '&viewDefId=' + viewId;

    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.bom.flat.bulk+json'
        }
    }).then(function (response) {
       
        console.log();
        console.log('    ' + response.data.flatItems.length + ' BOM rows found');
        
        utils.printLine();
        
        for(flatItem of response.data.flatItems) {
            console.log("    - " + flatItem.item.title + " | " + flatItem.totalQuantity);
        }
        
        callback();

    }).catch(function (error) {
        console.log(error);
        console.log(error.message);
    });
    
}