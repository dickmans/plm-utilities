// SET DEFINE VALUE FOR A DEFINED PROPERTY TO TRIGGER THE EDIT EVENT
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options/touch-records.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-04-23: code update
   -------------------------------------------------------------------------------------------------------- */

const options   = require('./options/touch-records.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([
    [ 'Workspace ID' , options.workspaceId],
    [ 'Field ID'     , options.fieldId],
    [ 'Field Value'  , options.fieldValue],
    [ 'Field Type ID', options.fieldTypeId]
]);


let sectionId    = -1;
let requestCount = 5;
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
            'fieldTypeID'   : options.fieldTypeId   
        }],
        'filter'        : [{
            'fieldID'     : options.fieldId,
            'fieldTypeID' : options.fieldTypeId,
            'filterType'  : { 'filterID' : 5 },
            'filterValue' : options.fieldValue
        }],
        'sort'          : [{
            'fieldID'        : options.fieldId,
            'fieldTypeID'    : options.fieldTypeId,
            'sortDescending' : false
        }]
    }

    f3m.search(params).then(function(results) {
        console.log('    Found ' + results.row.length + ' records to process');
        if(results.row.length === 0) utils.printEnd();
        else {
            utils.printLine();
            touchNextRecords(results.row);
        }
    });
     
}

function touchNextRecords(records) {

    let limit = (records.length < requestCount) ? records.length : requestCount;
    let requests = [];

    for(let i = 0; i < limit; i++) {
        requests.push(touchRecord(records[i]));
    }

    if(requests.length === 0) {
        searchRecords();
    } else {
        Promise.all(requests).then(function() {
            records.splice(0, limit);
            touchNextRecords(records);
        });
    }
}

function touchRecord(record) {

    return new Promise(function(resolve, reject) {

        console.log('    Processing item #' + ++count);

        let params = {
            'wsId' : options.workspaceId,
            'dmsId' : record.dmsId,
            'sections' : [{
                'id' : sectionId,
                'fields' : [{
                    'fieldId' : options.fieldId,
                    'value' : options.fieldValue
                }]
            }]
        }
        
        f3m.edit(params).then(function() { return resolve(); });

    });
    
}