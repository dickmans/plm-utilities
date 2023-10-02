// PERFROM TRANSITION ON RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-11-05: Switch to axios library
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId            = '82';         // equals Problem Reports in default tenant
let dmsId           = '14183';
let transitionLabel = 'Return';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');

utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['Transition', transitionLabel] ]);


f3m.login().then(function() {
    getItemStatus(function() {
        getItemTransitions(function(link) {
            transitionItem(link, function() {
                getItemStatus(function() {
                    utils.printEnd();
                });
            });
        });
    });
});



// Get current workflow status
function getItemStatus(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    axios.get(url).then(function (response) {
        console.log('    > Current status of record : ' + response.data.currentState.title);
        callback();
    }).catch(function (error) {
        console.log(error);
    });
    
}


// Get available transitions
function getItemTransitions(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/workflows/1/transitions';
        
    axios.get(url).then(function (response) {

        console.log('    > Available Transitions:');
        
        let transitionFound = false;
        
        for(transition of response.data) {
            
            console.log('      - (' + transition.urn + ') ' + transition.name);
            
            if(transition.name === transitionLabel) {
                
                transitionFound = true;
                console.log('    > Starting transition ' + transition.name);
                callback(transition.__self__);
                break;
                
            }
            
        }
        
        if(!transitionFound) {
            console.log('    > Transition ' + transitionLabel + ' not available');
            console.log(' ');
        }
        
    }).catch(function (error) {
        console.log(error);
    });
    
}


function transitionItem(link, callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/workflows/1/transitions';
    
    axios.post(url, {
        'comment' : 'Transitioned by external program'
    },{
        headers : {
            'content-location' : link
        }
    }).then(function (response) {
        callback();
    }).catch(function (error) {
        if(error.statusCode === 303) {
            console.log('   > Transition completed successfully');
            callback();
        } else {
            console.log(error);
        }
    });
    
}