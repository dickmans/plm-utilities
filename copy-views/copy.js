// DISTRIBUTES WORKSPACE VIEWS TO OTHER USERS IN SAME TENANT
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file options.js
// Author: Lee Worton, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-01-26: Replacement of API calls with f3m library
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2020-03-16: Initial Version
   -------------------------------------------------------------------------------------------------------- */


const settings  = require('../settings.js');
const options   = require('./options.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([ 
    ['Copy to', options.distributeTo ], 
    ['Workspaces Count', options.viewsToCopy.length ]
]);


let users           = [];
let sourceTableaus  = [];
let index           = 0;
let groups          = options.distributeTo.split(',');


f3m.login().then(function() {
    f3m.getUsers({
        'limit'              : 1000,
        'activeOnly'         : true,
        'includeTenantAdmin' : false
    }).then(function(data) {     

        utils.print('Found ' + data.items.length + ' active users in total');

        for(user of data.items) {

            if (user.email !== settings.user) {
                
                let add = (options.distributeTo === "*");    
                
                for(group of user.groups) {
                    if(groups.includes(group.shortName)) {
                        add = true;
                        false;
                   }
                }

                if(add) users.push({
                    email        : user.email,
                    views        : [],
                    currentWSID  : '',
                    currentViews : { 'tableaus' : [] }
                });
                
            }
        }
        
        utils.print('Copying view(s) to ' + users.length + ' users');

        console.log();
        console.log();
        utils.print('GETTING VIEWS LIST');
        utils.printLine();
        
        getWorkspacesViews();
        
    });
});


// Get workspaces views defined for current user
function getWorkspacesViews() {
    
    if(index < options.viewsToCopy.length) {
        
        getWorkspaceViews(function() {
            index++;
            getWorkspacesViews();
        });
        
    } else {
        
        console.log();
        console.log("    Found " + sourceTableaus.length + " views in total to copy");
        console.log();
        
        extractWorkspaceViews(function() {
            copyViews();
        });
        
    }
    
}
function getWorkspaceViews(callback) {    
    
    let sourceViews = options.viewsToCopy[index].views.split(",");
    
    f3m.getTableaus(options.viewsToCopy[index].wsId).then(function (response) {
        
	    for (sourceView of sourceViews) {            
		    for(tableau of response.tableaus) {
				if (tableau.title === sourceView.trim()) {

                    console.log('    WS ' + options.viewsToCopy[index].wsId + ' : Found the view "' + tableau.title + '"');
                    
                    tableau.setCopyDefault = (options.viewsToCopy[index].hasOwnProperty('default') && options.viewsToCopy[index].default === tableau.title);
                    tableau.force = (options.viewsToCopy[index].hasOwnProperty('force') && options.viewsToCopy[index].force === true);
                    sourceTableaus.push(tableau);

                    break;
				}
			}   
		}

        callback();
   
    }).catch(function (error) {
        utils.printError('    ERROR in requesting ' + url);
    });
    
}


// Get configuration of views to copy and store it per user
function extractWorkspaceViews(callback) {
     
    console.log();
    utils.print('GETTING VIEWS CONFIGURATIONS');
    utils.printLine();
    
    let requests = [];
    
    for(sourceTableau of sourceTableaus) {
        utils.print('Requesting ' + sourceTableau.link);
        requests.push(f3m.getTableau(sourceTableau.link));
    }
    
    Promise.all(requests).then(function(results) {
        
        console.log();
        console.log();
        utils.print('COPYING VIEWS');
        utils.printLine();

        let configs  = [];

        for(var i = 0; i < sourceTableaus.length; i++) {

            let config = results[i];
                config.setCopyDefault = sourceTableaus[i].setCopyDefault;
                config.force = sourceTableaus[i].force;
    
            configs.push(config);

        }
        
        for(user of users) user.views = JSON.parse(JSON.stringify(configs));;

        callback();
        
    });
    
}


// Once source view configs are available, copy them to users
function copyViews() {
    
    if(users.length === 0) {
        utils.printEnd();
    } else {
        copyView();
    }
    
}
function copyView() {
        
    let user = users[0];
    
    if(user.views.length === 0) {
        
        // There are no views left to copy for this user
        users.splice(0, 1);
        copyViews();
        
    } else {

        let config      = user.views[0];
        let currentWSID = config.workspace.link.split('/')[4];
        
        if(user.currentWSID !== currentWSID) { 

            user.currentWSID = currentWSID;
            f3m.getTableausByUser(currentWSID, user.email).then(function(response) {
                user.currentViews = response.tableaus;
                copyViews();
            });

        } else {

            let mode = 'create';
            let link = '';

            for(tableau of user.currentViews) {
                if(tableau.title === config.name) {
                    mode = (config.force === true) ? 'update' : 'skip';
                    link = tableau.link;
                    break;
                }
            }

                 if(mode === 'create') { createView(user, currentWSID, config); }
            else if(mode === 'update') { updateView(user, currentWSID, config, link); }
            else {
                console.log('    WS ' + currentWSID + ' : Skipping view "' + config.name + '" for user ' + user.email);
                user.views.splice(0,1);
                copyViews();
            }
            
        }
        
    }
    
}
function createView(user, wsId, config) {
 
    utils.print('WS ' + wsId + ' : Copying "' + config.name + '" to ' + user.email + ' (default : ' + config.setCopyDefault + ')');
    
    f3m.createTableauByUser(wsId, user.email, {
        'name'                    : config.name,
        'columns'                 : config.columns,
        'description'             : config.description,
        'showOnlyDeletedRecords'  : config.showOnlyDeletedRecords,
        'isDefault'               : config.setCopyDefault,
        'workspace'               : config.workspace,
        'createdDate'             : new Date()
    }).then(function(response) {
        user.views.splice(0,1);
        copyViews();
    });
    
}
function updateView(user, wsId, config, link) {
 
    utils.print('WS ' + wsId + ' : Updating "' + config.name + '" for ' + user.email + ' (default : ' + config.setCopyDefault + ')');
    
    f3m.updateTableauByUser(link, user.email, {
        'name'                    : config.name,
        'columns'                 : config.columns,
        'description'             : config.description,
        'showOnlyDeletedRecords'  : config.showOnlyDeletedRecords,
        'isDefault'               : config.setCopyDefault,
        'createdDate'             : new Date()
    }).then(function() {
        user.views.splice(0,1);
        copyViews();
    });
    
}