// PERFORM WORKFLOW TRANSITION ON ALL RECORDS BEING IN A DEFINED STATUS
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Set options in file /options/transition-records.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-04-23: code update
    - 2018-01-18: Initial version
    -------------------------------------------------------------------------------------------------------- */


const options   = require('./options/transition-records.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([
    [ 'Workspace ID' , options.workspaceId],
    [ 'From Status'  , options.fromStatus],
    [ 'Transition ID', options.transitionId],
    [ 'Comment'      , options.comment]
]);


let count        = 0;
let requestCount = 5;


f3m.login().then(function() {
    searchRecords();
});


function searchRecords() {
    
    console.log();
    console.log('    Searching items in status ' + options.fromStatus); 
    
    let params = {
        'wsId'          : options.workspaceId,
        'pageNo'        : 1,
        'pageSize'      : 50,
        'logicClause'   : 'AND',
        'fields': [ 
            { 'fieldID' : 'DESCRIPTOR'  , 'fieldTypeID' : 15 }
        ],
        'filter'        : [{
            'fieldID'     : 'WF_CURRENT_STATE',
            'fieldTypeID' : 1,
            'filterType'  : { 'filterID' : 15 },
            'filterValue' : options.fromStatus
        }],
       'sort' : [{
            'fieldID'        : 'DESCRIPTOR',
            'fieldTypeID'    : 15,
            'sortDescending' : false               
        }]
    }

    f3m.search(params).then(function(results) {
        console.log('    Found ' + results.row.length + ' records to process');
        if(results.row.length === 0) utils.printEnd();
        else {
            utils.printLine();
            processNextRecords(results.row);
        }
    });
     
}



function processNextRecords(records) {

    let limit = (records.length < requestCount) ? records.length : requestCount;
    let requests = [];

    for(let i = 0; i < limit; i++) {
        requests.push(processRecord(records[i]));
    }

    if(requests.length === 0) {
        searchRecords();
    } else {
        Promise.all(requests).then(function() {
            records.splice(0, limit);
            processNextRecords(records);
        });
    }

}

function processRecord(record) {

    console.log('    Processing item #' + (++count));

    return new Promise(function(resolve, reject) {

        let params = {
            'wsId'          : options.workspaceId,
            'dmsId'         : record.dmsId,
            'transitionId'  : options.transitionId,
            'comment'       : options.comment
        }
        
        f3m.performTransition(params).then(function() { return resolve(); });

    });
    
}