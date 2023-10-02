// EXTRACT REPORT DATA TO EXCEL AND SAVE LOCALLY
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-01-27: Changed filename (report name will be used instead of report description)
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-11-29: Initial Version
   -------------------------------------------------------------------------------------------------------- */


let reportId    = (process.argv.length > 2) ? process.argv[2] : '';
const xl        = require('excel4node');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');


utils.printStart([ ['Report ID', reportId] ]);

if(reportId === '') {

    utils.print('No report id provided, quiting program');
    utils.printEnd();

} else {
    f3m.login().then(function() {
        f3m.requestReport(reportId).then(function(data) {

            if(data === false) {
                
                console.log();
                utils.print('Faile to retrieve report ' + reportId);
                console.log();

            } else {

                console.log();
                utils.print('Report Name        : ' + data.reportDefinition.name);
                utils.print('Report Description : ' + data.reportDefinition.description);
                console.log();
        
                createExcelReport(data);

            }

        });
    });
}



// Store report data in Excel
function createExcelReport(data, callback) {
    
    utils.print('Creating Excel file');
    
    var wb              = new xl.Workbook();
    var ws              = wb.addWorksheet('Data');
    var reportResult    = data.reportResult;
    var reportColumns   = reportResult.columnKey;
    var reportData      = reportResult.row;
    
    ws.row(1).freeze();

    utils.print('Creating columns in Excel');
    
    for(var i = 0; i < reportColumns.length; i++) {
        var column = reportColumns[i];
        ws.cell(1, i + 1).string(column.label);
    }

    utils.print('Creating rows in Excel')
    
    for(var i = 0; i < reportData.length; i++) {
        
        var row = reportData[i];
        
        if((row.fields !==undefined) && (row.fields !== "undefined")) {

            var fields = row.fields.entry;
            
            if((row.fields.entry !==undefined) && (row.fields.entry !== "undefined")) {
            
                for(var j = 0; j < fields.length; j++) {
                
                    var field = fields[j];
                    
                    if((field.fieldData !==undefined) && (field.fieldData !== "undefined")) {
            
                        var value = field.fieldData.value;
                        
                        if(field.fieldData.hasOwnProperty("formattedValue")) value = field.fieldData.formattedValue;

                        if(typeof value === "undefined") value = "";
                        
                        ws.cell(i + 2, j + 1).string(value);
                    }
                }
                
            }
        }
        
    }
    
    let fileName = 'Report ' + reportId + ' ' + data.reportDefinition.name + ' ' + utils.getDateTimeString(new Date()) + '.xlsx';
     
    wb.write('../out/' + fileName);
    
    console.log();
    utils.print('Saved report as ../out/' + fileName);
    utils.printEnd();

}