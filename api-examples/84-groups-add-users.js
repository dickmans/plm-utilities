// ADD USER TO GROUPS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2021-09-13: Remove dependency on request-promise
    - 2021-03-26: Initial version
   -------------------------------------------------------------------------------------------------------- */


// Options
let user        = 'sven.dickmans';
let groupsToAdd = ['Service', 'Integration'];


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


let urns = [];

utils.printStart([ ['User to add', user], ['Groups', groupsToAdd] ]);

f3m.login().then(function() {
    getUser(function(userId) {
        getGroups(function() {
            addGroup(userId, function() {
                utils.printEnd();
            });
        });
    });
});


function getUser(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/users?filter[loginName]=' + user;
    
    axios.get(url).then(function (response) {
        callback(response.data.users[0].link);
    }).catch(function (error) {
        console.log(error.message);
    });

}


function getGroups(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/groups';
    
    axios.get(url, {
        headers : {
            Accept : 'application/vnd.autodesk.plm.groups.bulk+json'
        }
    }).then(function (response) {
        
        console.log(' ');
        console.log('    LIST OF GROUPS');
        console.log('   -------------------------------------------------------------------------------------');
        
        let urn = '';
        
        for(group of response.data.items) {
            console.log('    > ' + group.shortName + ' | ' + group.users.length + ' | ' + group.urn);
            if(groupsToAdd.indexOf(group.shortName) > -1) urns.push(group.urn);
        }
        
        console.log(' ');
        console.log('    (shortName | users.length | urn)');
        console.log(' ');
        
        callback();
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}


function addGroup(userId, callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + userId + '/groups';
    
    console.log(' ');
    console.log('    ADDING USER TO GROUPS');
    console.log('   -------------------------------------------------------------------------------------');
    console.log('    UserId     : ' + userId);
    console.log('    url        : ' + url);
    console.log('    Group URNs : ' + urns);

    axios.post(url, 
        urns
    ).then(function (response) {
        
        callback();

    }).catch(function (error) {
        console.log(error.message);
    });
    
}