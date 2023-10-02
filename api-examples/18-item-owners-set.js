// SET NEW OWNER OF DEFINED RECORD
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
let newOwner    = 'Sven Dickmans';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['New Onwer', newOwner] ]);

f3m.login().then(function() {
    getOwners(function(owners) {
        getUser(function(userId) {
            setOwner(owners, userId, function() {
                utils.printEnd();
            });
        });
    });
});


function getOwners(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/owners';
    
    axios.get(url).then(function (response) {
        
        console.log('    ' + response.data.owners.length + ' ownership entries found');      
        
        callback(response.data.owners);
        
    }).catch(function (error) {
        console.log(error);    
    });  
    
}

function getUser(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users/?includeTenantAdmin=false&limit=1000&mappedOnly=false&offset=0';
    
    axios.get(url).then(function (response) {
        
        for(user of response.data.users) {
            
            let userTitle = user.title;
            if(userTitle.endsWith('=' + newOwner + ']')) {
                
                let userData = user.link.split('/');
                let userId = userData[userData.length  - 1];

                console.log('    Found given user: ' + userId);
                callback(userId);
            }
            
        }
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}

function setOwner(owners, userId, callback) {
    
    for(var i = owners.length - 1; i >= 0; i-- ){
        let owner = owners[i];
        if(owner.ownerType === 'PRIMARY') {
            owners.splice( i, 1 );
            break;   
        }
    }
        
    owners.push({
        'notify'    : false,
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/owners/' + userId,
        'ownerType' : 'PRIMARY'
    });

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/owners';
    
    axios.put(url, owners).then(function (response) {
        
        console.log('    Owner has been changed');
        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}