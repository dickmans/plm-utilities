// ARCHIVE ALL DATA THAT HAS BEEN CREATED TODAY
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Set options in file /options.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-05-08: Change setting to support range selection: today, yesterday, or all
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-02-08: Added option for report only
    - 2022-02-01: Initial version
   -------------------------------------------------------------------------------------------------------- */


const options   = require('./options.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


let now = new Date();

if(options.range.toLowerCase() === 'yesterday') now.setDate(now.getDate() - 1);

let dateString      = utils.getDateString(now);
let requestsCount   = 5;
let limit           = 100;
let index           = 1;
let workspaces      = options.workspaces;

let deleted, offset;


utils.printStart([ 
    ['Workspaces'    , options.workspaces], 
    ['Report only'   , options.reportOnly], 
    ['Requests Count', requestsCount],
    ['Range'         , options.range]
]);



f3m.login().then(function() {
    if(workspaces.length === 0) {
        utils.print('Getting list of all workspaces');
        f3m.getWorksapces().then(function(data) {
            console.log('    Found ' + data.totalCount + ' workspaces');
            console.log();
            for(workspace of data.items) {
                workspaces.push(workspace.link.split('/')[4]);
            }
            processNextWorkspace();
        });
    } else {
        processNextWorkspace();
    }
});


// Proceed with next workspace in the list
function processNextWorkspace() {
    
    offset = 0;
    deleted = [];

    if(workspaces.length > 0) {
        console.log();
        utils.printLine();
        utils.print('Start Processing Workspace #' + (index++) + ': ' + workspaces[0]);
        processWorkspace();
    } else {
        utils.printEnd();
    }
    
}


// Get items to archive
function processWorkspace() {

    let params = {
        'wsId'   : workspaces[0],
        'offset' : offset,
        'limit'  : limit,
        'query'  : '*'
    }

    if(options.range.toLowerCase() !== 'all') params.query = '*+AND+createdOn%3D' + dateString;

    f3m.query(params).then(function(data) {
        offset += limit;
        if(data === '') {
            workspaces.splice(0, 1);
            processNextWorkspace();         
        } else {
            archiveItems(data.items);
        }
    });

}

function archiveItems(records) {

    if(records.length === 0) processWorkspace();

    else {

        let requestsLimit = (records.length < requestsCount) ? records.length : requestsCount;
        let promises = [];

        for(let i = 0; i < requestsLimit; i++) {
            let record = records[i];
            if(deleted.indexOf(record.__self__) < 0) {
                if(options.reportOnly === true) {
                    console.log('     > This record would get archived: ' + record.descriptor + ' in workspace ' + record.workspaceLongName);
                } else {
                    promises.push(f3m.archiveItem(record.__self__));
                    console.log('     > Archiving ' + record.descriptor + ' in workspace ' + record.workspaceLongName);
                }
            }
            deleted.push(record.__self__);
        }

        records.splice(0, requestsLimit);

        if(options.reportOnly === true) {
            archiveItems(records);
        } else {
            Promise.all(promises).then(function(){
                archiveItems(records)
            });
        }

    }

}