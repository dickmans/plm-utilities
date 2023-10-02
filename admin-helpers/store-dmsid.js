// STORE DMSID IN GIVEN FIELD FOR RECORDS IN DEFINED WORKSPACE
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options/store-dmsid.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
     - 2021-08-11: initial release
   -------------------------------------------------------------------------------------------------------- */

const options   = require('./options/store-dmsid.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([
    [ 'Workspace ID' , options.workspaceId],
    [ 'Field ID'     , options.fieldId]
]);

let sectionId    = -1;
let requestCount = 3;
let count        = 0;

f3m.login().then(function() {
    f3m.getFieldSectionId(options.workspaceId, options.fieldId).then(function(result) {
        if(result === -1) {
            utils.printEnd();
        } else {
            sectionId = result;
            searchRecords();
        }
    });
});



function searchRecords() {
    
    console.log();
    console.log('    Searching items'); 
    
    let params = {
        'wsId'          : options.workspaceId,
        'pageNo'        : 1,
        'pageSize'      : 100,
        'logicClause'   : 'AND',
        'fields'        : [{
            'fieldID'       : options.fieldId,
            'fieldTypeID'   : 0   
        }],
        'filter'        : [{
            'fieldID'     : options.fieldId,
            'fieldTypeID' : 0,
            'filterType'  : { 'filterID' : 20 },
            'filterValue' : ''
        }],
        'sort'          : [{
            'fieldID'        : options.fieldId,
            'fieldTypeID'    : 0,
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

    return new Promise(function(resolve, reject) {

        console.log('    Processing item #' + ++count);

        let params = {
            'wsId' : options.workspaceId,
            'dmsId' : record.dmsId,
            'sections' : [{
                'id' : sectionId,
                'fields' : [{
                    'fieldId' : options.fieldId,
                    'value' : record.dmsId
                }]
            }]
        }
        
        f3m.edit(params).then(function() { return resolve(); });

    });
    
}