// EXTRACT DOCUMENTATION OF YOUR TENANT
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Usage  : node extract.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-07-18: Update to reflect changes in library
    - 2023-01-26: Replacement of API calls with f3m library & bugfixes
    - 2022-02-16: Integration in TS F3M Extensions Package
    - Oct 30: Added Error Handling for workspaces having classification sections without root node defined
    - Jul 29: Replaced request(-promise) with axios
    - Jul 28: Performing promised requests instead of sequential requests for better performance
    - Jul 22: Settings are now managed in external file to enable usage for multiple tenants
    - Jul 21: Switched from V1 authentication to V3 authentication
    - Jul 21: Switched to V3 API to get grid column details
    - Jul 21: Added extraction of pick list details to Excel report
    - Jul 21: Added extraction of Managed Items tab columns
    - Jun 18: Added configuration setting to disable date suffixes in settings.folder & file names
    - Jun 18: Save logs in files
    - Jun 18: Added configuration setting to disable creation of Excel file
    - Jun 18: Added configuration setting to extract Security details (users, groups, roles)
    -------------------------------------------------------------------------------------------------------- */


/* --------------------------------------------------------------------------------------------------------
    DO NOT MODIFY BELOW
    Edit your options files (options.js) to set configuration options
    -------------------------------------------------------------------------------------------------------- */

const options   = require('./options.js');
const settings  = require('../settings.js');
const utils     = require('../node_modules_adsk/utils.js');
const plm       = require('../node_modules_adsk/f3m.js');
const fs        = require('fs');
const xl        = require('excel4node');
const tenant    = settings.tenant;

let workspaces          = [];
let index               = 0;
let indexScripts        = 0;
let indexPicklists      = 0;
let wb                  = new xl.Workbook();
let wsWorkspaces        = wb.addWorksheet('Workspaces');
let wsStates            = wb.addWorksheet('Workflow States');
let wsTransitions       = wb.addWorksheet('Workflow Transitions');
let wsScripts           = wb.addWorksheet('Scripts');
let wsPicklists         = wb.addWorksheet('Picklists');
let wsSecurity          = wb.addWorksheet('Security');
let wsSystemLog         = wb.addWorksheet('System Log');
let wsSetupLog          = wb.addWorksheet('Setup Log');
let rowWorkspace        = 3;
let rowState            = 2;
let rowTransition       = 2;
let rowScript           = 2;
let rowPicklist         = 2;
let countWSFields       = 0;
let delay               = 1000;
let now                 = new Date();
let month               = now.getMonth() + 1;
let day                 = now.getDate();
let hours               = now.getHours();
let minutes             = now.getMinutes();
let seconds             = now.getSeconds();
let selectedWorkspaces  = (options.workspaceIds === '') ? [] : options.workspaceIds.split(',');


let scripts, picklists, users, groups, roles, permissions, workflowPermissions;
let colBaseDetails, colBaseGrid, colBaseLast;

utils.printStart([
    [ 'Folder' , options.folder],
    [ 'Workspace IDs' , options.workspaceIds],
    [ 'Append Date' , options.appendDate],
    [ 'Extract Scripts' , options.extractScripts],
    [ 'Extract Picklists' , options.extractPicklists],
    [ 'Extract Security' , options.extractSecurity],
    [ 'Extract Fields' , options.extractFields],
    [ 'Extract Grids' , options.extractGrid],
    [ 'Extract Managed Items' , options.extractManagedItems],
    [ 'Extract Workflows' , options.extractWorkflow],
    [ 'System Log Entries'     , options.limitSystemLog],
    [ 'Setup Log Entries'  , options.limitSetupLog],
    [ 'Create Excel File', options.createExcelFile]
]);



wb.dateFormat = 'm/d/yy hh:mm:ss';

let colors = ['#334659', 'fcc776', 'faa21b', 'd9730b', 'bf5808', '0696d7', '0696d7', '32bcad', '87b340'];

let styleWorkspace = wb.createStyle({
    alignment: {
        vertical : 'center'
    },
    border: { 
        left:   { style: 'thin', color: '#f2f2f2' },
        right:  { style: 'thin', color: '#f2f2f2' },
        top:    { style: 'thin', color: '#f2f2f2' },
        bottom: { style: 'thin', color: '#f2f2f2' }
    },
    font: {
        color : '#666666'
    },
    fill: { 
        fgColor: '#f2f2f2',
        type: 'pattern',
        patternType : 'solid'
    }
});
let styleHeader = wb.createStyle({
    alignment: {
        horizontal: 'center',
        vertical : 'center'
    },
    font: {
        color: '#ffffff',
        size: 16
    },
    fill: { 
        type: 'pattern',
        patternType : 'solid'
    }
});
let styleSubHeader = wb.createStyle({
    alignment: {
        horizontal: 'left',
        indent : 1,
        vertical : 'center'
    },
    font: {
        color: '#ffffff',
        size: 10
    },
    fill: { 
        type: 'pattern',
        patternType : 'solid'
    }
});
let styleDefault = wb.createStyle({
    alignment: {
        indent : 1
    },
    border: { 
        left:   { style: 'thin', color: '#ffffff' },
        right:  { style: 'thin', color: '#ffffff' },
        top:    { style: 'thin', color: '#ffffff' },
        bottom: { style: 'thin', color: '#ffffff' }
    },
    font: {
        color : '#666666'
    }
});


setLayout();
setPath();
createFolders();
plm.login().then(function() { getBasics(); });


// Initialize
function setLayout() {
    
    setFreezePanes();
    setHeaderHeights();  
    setLayoutWorkspace();
    setLayoutItemDetails();
    setLayoutGrid();
    setLayoutManagedItems();
    setLayoutStates();
    setLayoutTransitions();
    setLayoutScripts();
    setLayoutPicklists();
    setLayoutSystemLog();
    setLayoutSetupLog();
//    setGrouping();
    
}
function setFreezePanes() {
    
    wsWorkspaces.column(2).freeze();
    wsWorkspaces.row(2).freeze();
    wsStates.row(1).freeze();
    wsTransitions.row(1).freeze();
    wsTransitions.column(3).freeze();
    wsScripts.row(1).freeze();
    wsScripts.column(2).freeze(); 
    wsPicklists.row(1).freeze();
    wsPicklists.column(1).freeze();
    wsSystemLog.row(1).freeze();
    wsSetupLog.row(1).freeze();
    
}
function setHeaderHeights() {
    
    wsWorkspaces.row(1).setHeight(40);
    wsWorkspaces.row(2).setHeight(30);
    wsStates.row(1).setHeight(30);
    wsTransitions.row(1).setHeight(30);
    wsScripts.row(1).setHeight(30);
    wsPicklists.row(1).setHeight(30);
    wsSystemLog.row(1).setHeight(30);
    wsSetupLog.row(1).setHeight(30);
    
}
function setLayoutWorkspace() {
    
    var col = 1;

    wsWorkspaces.column(col++).setWidth(10); // Workspace
    wsWorkspaces.column(col++).setWidth(35);
    wsWorkspaces.column(col++).setWidth(2);

    wsWorkspaces.column(col++).setWidth(20); // Tab Names
    wsWorkspaces.column(col++).setWidth(22);
    wsWorkspaces.column(col++).setWidth(2);
    
    wsWorkspaces.column(col++).setWidth(18); // Descriptor
    wsWorkspaces.column(col++).setWidth(25);
    wsWorkspaces.column(col++).setWidth(2)
    
    wsWorkspaces.column(col++).setWidth(25); // Relationships
    wsWorkspaces.column(col++).setWidth(25);
    wsWorkspaces.column(col++).setWidth(2);
    
    wsWorkspaces.column(col++).setWidth(18); // APVs
    wsWorkspaces.column(col++).setWidth(25);
    wsWorkspaces.column(col++).setWidth(2);
    
    colBaseDetails  = col;
    colBaseGrid     = colBaseDetails + 17;
    colBaseLast     = colBaseGrid + 7;
    
    wsWorkspaces.cell(1,  1, 2,  2, true).style(styleHeader).style( { fill: { fgColor: colors[0] } } ).string('Workspace');
    wsWorkspaces.cell(1,  4, 2,  5, true).style(styleHeader).style( { fill: { fgColor: colors[1] } } ).string('Tab Names');
    wsWorkspaces.cell(1,  7, 2,  8, true).style(styleHeader).style( { fill: { fgColor: colors[2] } } ).string('Behaviors');
//    wsWorkspaces.cell(1, 10, 2, 11, true).style(styleHeader).style( { fill: { fgColor: colors[3] } } ).string('Descriptor');
    wsWorkspaces.cell(1, 10, 1, 11, true).style(styleHeader).style( { fill: { fgColor: colors[3] } } ).string('Relationships');
    wsWorkspaces.cell(2, 10, 2, 10).style(styleSubHeader).style( { fill: { fgColor: colors[3] } } ).string('Tab').style( { alignment : { horizontal : 'right' } });
    wsWorkspaces.cell(2, 11, 2, 11).style(styleSubHeader).style( { fill: { fgColor: colors[3] } } ).string('Workspace');
    wsWorkspaces.cell(1, 13, 1, 14, true).style(styleHeader).style( { fill: { fgColor: colors[4] } } ).string('Advanced Print Views');
    wsWorkspaces.cell(2, 13, 2, 13).style(styleSubHeader).style( { fill: { fgColor: colors[4] } } ).string('Hidden').style( { alignment : { horizontal : 'right' } });
    wsWorkspaces.cell(2, 14, 2, 14).style(styleSubHeader).style( { fill: { fgColor: colors[4] } } ).string('View Name');    
    
}
function setLayoutItemDetails() {
 
    wsWorkspaces.column(colBaseDetails +  0).setWidth(35);
    wsWorkspaces.column(colBaseDetails +  1).setWidth(25); 
    wsWorkspaces.column(colBaseDetails +  2).setWidth(25); 
    wsWorkspaces.column(colBaseDetails +  3).setWidth(25); 
    wsWorkspaces.column(colBaseDetails +  4).setWidth(20); 
    wsWorkspaces.column(colBaseDetails +  5).setWidth(8); 
    wsWorkspaces.column(colBaseDetails +  6).setWidth(40); 
    wsWorkspaces.column(colBaseDetails +  7).setWidth(10); 
    wsWorkspaces.column(colBaseDetails +  8).setWidth(10); 
    wsWorkspaces.column(colBaseDetails +  9).setWidth(10); 
    wsWorkspaces.column(colBaseDetails + 10).setWidth(10); 
    wsWorkspaces.column(colBaseDetails + 11).setWidth(20); 
    wsWorkspaces.column(colBaseDetails + 12).setWidth(10); 
    wsWorkspaces.column(colBaseDetails + 13).setWidth(20); 
    wsWorkspaces.column(colBaseDetails + 14).setWidth(20); 
    wsWorkspaces.column(colBaseDetails + 15).setWidth(10);
    
    wsWorkspaces.cell(1, colBaseDetails +  0, 1, colBaseGrid - 2, true).style(styleHeader).style( { fill: { fgColor: colors[6] } } ).string('Item Details');
    wsWorkspaces.cell(2, colBaseDetails +  0, 2, colBaseDetails +  0).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Section').style( { alignment : { horizontal : 'right' } });
    wsWorkspaces.cell(2, colBaseDetails +  1, 2, colBaseDetails +  1).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Field Name');
    wsWorkspaces.cell(2, colBaseDetails +  2, 2, colBaseDetails +  2).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Field ID');
    wsWorkspaces.cell(2, colBaseDetails +  3, 2, colBaseDetails +  3).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Field Description');
    wsWorkspaces.cell(2, colBaseDetails +  4, 2, colBaseDetails +  4).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Data Type');
    wsWorkspaces.cell(2, colBaseDetails +  5, 2, colBaseDetails +  5).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('UOM');
    wsWorkspaces.cell(2, colBaseDetails +  6, 2, colBaseDetails +  6).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Pick List');
    wsWorkspaces.cell(2, colBaseDetails +  7, 2, colBaseDetails +  7).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Field Length');
    wsWorkspaces.cell(2, colBaseDetails +  8, 2, colBaseDetails +  8).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Display Length');
    wsWorkspaces.cell(2, colBaseDetails +  9, 2, colBaseDetails +  9).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Editable');
    wsWorkspaces.cell(2, colBaseDetails + 10, 2, colBaseDetails + 10).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Visibility');
    wsWorkspaces.cell(2, colBaseDetails + 11, 2, colBaseDetails + 11).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Default Value');
    wsWorkspaces.cell(2, colBaseDetails + 12, 2, colBaseDetails + 12).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Derived');
    wsWorkspaces.cell(2, colBaseDetails + 13, 2, colBaseDetails + 13).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Derived Source');
    wsWorkspaces.cell(2, colBaseDetails + 14, 2, colBaseDetails + 14).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Formula');
    wsWorkspaces.cell(2, colBaseDetails + 15, 2, colBaseDetails + 15).style(styleSubHeader).style( { fill: { fgColor: colors[6] } } ).string('Validation');
    
}
function setLayoutGrid() {
    
    wsWorkspaces.column(colBaseGrid - 1).setWidth(2);
    wsWorkspaces.column(colBaseGrid + 0).setWidth(25); 
    wsWorkspaces.column(colBaseGrid + 1).setWidth(25); 
    wsWorkspaces.column(colBaseGrid + 2).setWidth(20); 
    wsWorkspaces.column(colBaseGrid + 3).setWidth(15); 
    wsWorkspaces.column(colBaseGrid + 4).setWidth(20); 
    wsWorkspaces.column(colBaseGrid + 5).setWidth(10); 
    wsWorkspaces.column(colBaseGrid + 6).setWidth(15); 
    wsWorkspaces.column(colBaseGrid + 7).setWidth(20); 
    
    wsWorkspaces.cell(1, colBaseGrid + 0, 1, colBaseLast, true).style(styleHeader).style( { fill: { fgColor: colors[7] } } ).string('Grid');
    wsWorkspaces.cell(2, colBaseGrid + 0, 2, colBaseGrid + 0).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Field Name');
    wsWorkspaces.cell(2, colBaseGrid + 1, 2, colBaseGrid + 1).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Field ID');
    wsWorkspaces.cell(2, colBaseGrid + 2, 2, colBaseGrid + 2).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Field Description');
    wsWorkspaces.cell(2, colBaseGrid + 3, 2, colBaseGrid + 3).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Data Type');
    wsWorkspaces.cell(2, colBaseGrid + 4, 2, colBaseGrid + 4).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Field Length');
    wsWorkspaces.cell(2, colBaseGrid + 5, 2, colBaseGrid + 5).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Display Length');
    wsWorkspaces.cell(2, colBaseGrid + 6, 2, colBaseGrid + 6).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Editability');
    wsWorkspaces.cell(2, colBaseGrid + 7, 2, colBaseGrid + 7).style(styleSubHeader).style( { fill: { fgColor: colors[7] } } ).string('Default Value');
    
}
function setLayoutManagedItems() {
    
    wsWorkspaces.column(colBaseGrid +  8).setWidth(2);
    wsWorkspaces.column(colBaseGrid +  9).setWidth(25); 
    wsWorkspaces.column(colBaseGrid + 10).setWidth(25); 
    wsWorkspaces.column(colBaseGrid + 11).setWidth(20); 
    wsWorkspaces.column(colBaseGrid + 12).setWidth(15); 
    wsWorkspaces.column(colBaseGrid + 13).setWidth(20); 
    wsWorkspaces.column(colBaseGrid + 14).setWidth(10); 
    wsWorkspaces.column(colBaseGrid + 15).setWidth(15); 
    wsWorkspaces.column(colBaseGrid + 16).setWidth(20); 
    
    wsWorkspaces.cell(1, colBaseGrid + 9, 1, colBaseGrid + 16, true).style(styleHeader).style( { fill: { fgColor: colors[8] } } ).string('Managed Items');
    wsWorkspaces.cell(2, colBaseGrid + 9, 2, colBaseGrid + 9).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Field Name');
    wsWorkspaces.cell(2, colBaseGrid + 10, 2, colBaseGrid + 10).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Field ID');
    wsWorkspaces.cell(2, colBaseGrid + 11, 2, colBaseGrid + 11).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Field Description');
    wsWorkspaces.cell(2, colBaseGrid + 12, 2, colBaseGrid + 12).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Data Type');
    wsWorkspaces.cell(2, colBaseGrid + 13, 2, colBaseGrid + 13).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Field Length');
    wsWorkspaces.cell(2, colBaseGrid + 14, 2, colBaseGrid + 14).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Display Length');
    wsWorkspaces.cell(2, colBaseGrid + 15, 2, colBaseGrid + 15).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Editability');
    wsWorkspaces.cell(2, colBaseGrid + 16, 2, colBaseGrid + 16).style(styleSubHeader).style( { fill: { fgColor: colors[8] } } ).string('Default Value');
    
}
function setLayoutStates() {
        
    wsStates.row(1).filter({
        firstColumn : 1,
        lastColumn : 6
    });
    
    wsStates.row(1).filter();
    
    wsStates.column(1).setWidth(40);
    wsStates.column(2).setWidth(30);
    wsStates.column(3).setWidth(30);
    wsStates.column(4).setWidth(25);
    wsStates.column(5).setWidth(25);
    wsStates.column(6).setWidth(25);
    
    wsStates.cell(1,1).string('Workspace Name');
    wsStates.cell(1,2).string('State Name');
    wsStates.cell(1,3).string('State ID');
    wsStates.cell(1,4).string('Hidden State');
    wsStates.cell(1,5).string('Lock State');
    wsStates.cell(1,6).string('Managed State');
    
    wsStates.cell(1, 1, 1, 6 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsStates.cell(1,1,1,6).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setLayoutTransitions() {
    
    wsTransitions.row(1).filter({
        firstColumn : 1,
        lastColumn : 15
    });
    
    wsTransitions.column(1).setWidth(30);
    wsTransitions.column(2).setWidth(30);
    wsTransitions.column(3).setWidth(30);
    wsTransitions.column(4).setWidth(30);
    wsTransitions.column(5).setWidth(30);
    wsTransitions.column(6).setWidth(20);
    wsTransitions.column(7).setWidth(20);
    wsTransitions.column(8).setWidth(25);
    wsTransitions.column(9).setWidth(25);
    wsTransitions.column(10).setWidth(25);
    wsTransitions.column(11).setWidth(30);
    wsTransitions.column(12).setWidth(30);
    wsTransitions.column(13).setWidth(40);
    wsTransitions.column(14).setWidth(25);
    wsTransitions.column(15).setWidth(25);
    
    wsTransitions.cell(1,1).string('Workspace Name');
    wsTransitions.cell(1,2).string('Transition Name');
    wsTransitions.cell(1,3).string('Transition ID');
    wsTransitions.cell(1,4).string('From State');
    wsTransitions.cell(1,5).string('To State');
    wsTransitions.cell(1,6).string('Permission');
    wsTransitions.cell(1,7).string('Comments');
    wsTransitions.cell(1,8).string('Send mail to owner');
    wsTransitions.cell(1,9).string('Show in MOW');
    wsTransitions.cell(1,10).string('Notify by mail');
    wsTransitions.cell(1,11).string('Condition script');
    wsTransitions.cell(1,12).string('Validation script');
    wsTransitions.cell(1,13).string('Action script');
    wsTransitions.cell(1,14).string('Require password');
    wsTransitions.cell(1,15).string('Hidden');
    
    wsTransitions.cell(1, 1, 1, 15 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsTransitions.cell(1,1,1,15).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setLayoutScripts() {
    
    wsScripts.row(1).filter({
        firstColumn : 1,
        lastColumn : 6
    });
    
    wsScripts.column(1).setWidth(15);
    wsScripts.column(2).setWidth(55);
    wsScripts.column(3).setWidth(20);
    wsScripts.column(4).setWidth(15);
    wsScripts.column(5).setWidth(25);
    wsScripts.column(6).setWidth(80);
    
    wsScripts.cell(1,1).string('Type');
    wsScripts.cell(1,2).string('Name');
    wsScripts.cell(1,3).string('Behavior Type');
    wsScripts.cell(1,4).string('Version');
    wsScripts.cell(1,5).string('In Use');
    wsScripts.cell(1,6).string('Imports');
    
    wsScripts.cell(1, 1, 1, 6 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsScripts.cell(1,1,1,6).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setLayoutPicklists() {
    
    wsPicklists.row(1).filter({
        firstColumn : 1,
        lastColumn : 6
    });
    
    wsPicklists.column(1).setWidth(40);
    wsPicklists.column(2).setWidth(65);
    wsPicklists.column(3).setWidth(12);
    wsPicklists.column(4).setWidth(20);
    wsPicklists.column(5).setWidth(80);
    wsPicklists.column(6).setWidth(20);
    wsPicklists.column(7).setWidth(120);
    
    wsPicklists.cell(1,1).string('Name');
    wsPicklists.cell(1,2).string('ID');
    wsPicklists.cell(1,3).string('In Use');
    wsPicklists.cell(1,4).string('Value Count');
    wsPicklists.cell(1,5).string('Values');
    wsPicklists.cell(1,6).string('Workspace ID');
    wsPicklists.cell(1,7).string('URI');

    
    wsPicklists.cell(1, 1, 1, 7 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsPicklists.cell(1,1,1,7).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setLayoutSystemLog() {
    
    wsSystemLog.row(1).filter({
        firstColumn : 1,
        lastColumn : 8
    });
    
    wsSystemLog.column(1).setWidth(15);
    wsSystemLog.column(2).setWidth(20);
    wsSystemLog.column(3).setWidth(35);
    wsSystemLog.column(4).setWidth(20);
    wsSystemLog.column(5).setWidth(45);
    wsSystemLog.column(6).setWidth(25);
    wsSystemLog.column(7).setWidth(40);
    wsSystemLog.column(8).setWidth(40);
    
    wsSystemLog.cell(1,1).string('Date');
    wsSystemLog.cell(1,2).string('User');
    wsSystemLog.cell(1,3).string('Action');
    wsSystemLog.cell(1,4).string('Invoker');
    wsSystemLog.cell(1,5).string('Item');
    wsSystemLog.cell(1,6).string('Field Name');
    wsSystemLog.cell(1,7).string('Old Value');
    wsSystemLog.cell(1,8).string('New Value');
    
    wsSystemLog.cell(1, 1, 1, 8 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsSystemLog.cell(1,1,1,8).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setLayoutSetupLog() {
    
    wsSetupLog.row(1).filter({
        firstColumn : 1,
        lastColumn : 5
    });
    
    wsSetupLog.column(1).setWidth(15);
    wsSetupLog.column(2).setWidth(20);
    wsSetupLog.column(3).setWidth(45);
    wsSetupLog.column(4).setWidth(25);
    wsSetupLog.column(5).setWidth(400);
    
    wsSetupLog.cell(1,1).string('Date');
    wsSetupLog.cell(1,2).string('User');
    wsSetupLog.cell(1,3).string('Context');
    wsSetupLog.cell(1,4).string('Action');
    wsSetupLog.cell(1,5).string('Details');
    
    wsSetupLog.cell(1, 1, 1, 5 + 50).style(styleDefault).style( { border: { right: { style: 'thin', color: '#ffffff' }}} );
    wsSetupLog.cell(1,1,1,5).style(styleHeader).style( { 
        alignment : {
            horizontal: 'left',
            indent : 1
        }, 
        fill: { 
            fgColor: colors[0] 
        } 
    } );
    
}
function setGrouping() {
    
    for(var i = 3             ; i < colBaseDetails - 1; i++) wsWorkspaces.column(i).group(1);
    for(var i = colBaseDetails; i < colBaseGrid - 1   ; i++) wsWorkspaces.column(i).group(1);
    for(var i = colBaseGrid   ; i < colBaseLast + 1   ; i++) wsWorkspaces.column(i).group(1);
    
    
}
function setPath() {
    
    if(month   < 10) month   = '0' + month;
    if(  day   <= 9)   day   = '0' + day  ;
    if(hours   < 10) hours   = '0' + hours;
    if(minutes < 10) minutes = '0' + minutes;
    if(seconds < 10) seconds = '0' + seconds;
    
    if(!options.folder.endsWith('/')) options.folder += '/';
    
    options.folder += tenant.toUpperCase();
    
    if(options.appendDate) {
        options.folder += ' ' + now.getFullYear() + '-' + month + '-' + day + ' ';
        options.folder += hours + '-' + minutes + '-' + seconds;
    } else if(fs.existsSync(options.folder)) {
        fs.rmdirSync(options.folder, { recursive: true });
    }
    
}
function createFolders() {
    
    var dirs    = options.folder.split('/');
    var curPath = '';
    
    for(var i = 1; i < dirs.length; i++) {
        
        curPath += '/' + dirs[i];
        if (!fs.existsSync(curPath)){
            fs.mkdirSync(curPath);
        }
        
    }
    
    if(options.extractScripts) {

        createFolder('Scripts');
        createFolder('Scripts/ACTION Scripts');
        createFolder('Scripts/CONDITION Scripts');
        createFolder('Scripts/LIBRARY Scripts');
        createFolder('Scripts/VALIDATION Scripts');
        
    }
    
    if(options.extractPicklists)    createFolder('Picklists');
    if(options.extractSecurity)     createFolder('Security');
    if(options.extractFields)       createFolder('Workspaces Fields');
    if(options.extractGrid)         createFolder('Workspaces Grid Columns');
    if(options.extractManagedItems) createFolder('Workspaces Managed Items Columns');
    if(options.extractWorkflow)     createFolder('States');
    if(options.extractWorkflow)     createFolder('Transitions');
    
    if((options.limitSystemLog > 0) || (options.limitSetupLog > 0)) createFolder('Logs');
    
}
function createFolder(name) {
    
    if (!fs.existsSync(options.folder + '/' + name)){
        fs.mkdirSync(options.folder + '/' + name);
    }
    
}


function getBasics() {
    
    console.log();
    console.log();
    utils.print('Getting Tenant Information');
    utils.printLine();
    
    let requests = [
        plm.getWorkspaces(),
        plm.getScripts(),
        plm.getPicklists(),
        plm.getUsersV1(),
        plm.getGroupsV1(),
        plm.getRolesV1(),
        plm.getPermissions()
    ];

    Promise.all(requests).then(function(data) {

        parseWorkspaces(data[0]);
        parseScripts(data[1]);
        parsePicklists(data[2]);
        parseUsers(data[3]);
        parseGroups(data[4]);
        parseRoles(data[5]);
        parsePermissions(data[6]);

        if(options.extractScripts) {
            console.log();
            console.log();
            utils.print('Downloading Script Resources');
            utils.printLine();
        }
        
        setTimeout(function () {
            downloadScripts();
        }, delay); 
        
    });
    
}


// Extract Basic Information
function parseWorkspaces(data) {

    console.log('      Workspaces : ' + data.items.length);

    for(item of data.items) {

        var dataWorkspace = item;
        var linkWorkspace = dataWorkspace.link;
        var tempWorkspace = linkWorkspace.split('/');
        var idWorkspace   = tempWorkspace[tempWorkspace.length - 1];

        var newWorkspace = {
            'label'     : dataWorkspace.title,
            'category'  : dataWorkspace.category.name,
            'id'        : idWorkspace
        }

        workspaces.push(newWorkspace); 

    }
    workspaces.sort(function(a, b){
        var nameA=a.label.toLowerCase(), nameB=b.label.toLowerCase()
        if (nameA < nameB)
            return -1 
        if (nameA > nameB)
            return 1
        return 0 
    });
         
}
function parseScripts(data) {

    let inUse = (options.workspaceIds === '') ? 'false' : '?';

    scripts = data.scripts;

    scripts.sort(function(a, b){
        return a.uniqueName.localeCompare(b.uniqueName);
    });  

    for(var i = 0; i < scripts.length; i++) {
        scripts[i].inUse = inUse;
    }            

    console.log('         Scripts : ' + scripts.length); 
            
}
function parsePicklists(data) {
    
    picklists = data.list.picklist;
        
    picklists.sort(function(a, b){
        return a.name.localeCompare(b.name);
    });  
    
    for(picklist of picklists) {
        picklist.count  = -1;
        picklist.inUse  = false;
        picklist.values = '';
    }
        
    console.log('       Picklists : ' + picklists.length); 
         
}
function parseUsers(data) {
    
    users = data.list.user;
        
    console.log('           Users : ' + users.length);

    for(let i = 0; i < users.length; i++) {

        let user      = users[i];
        let firstName = user.firstName;
        let lastName  = user.lastName;
        let userName  = lastName;

        if(firstName !== '') userName +=  ', ' + firstName;

        user.userName = userName;

    }

    users.sort(function(a, b){
        return a.userName.localeCompare(b.userName);
    });

    if(options.extractSecurity)  fs.writeFile(options.folder + '/Security/users.json', JSON.stringify(data, null, 3), function() {});

}
function parseRoles(data) {
 
    roles = data.list.role;

    if(selectedWorkspaces.length > 0) {

        for(var i = roles.length - 1; i >= 0; i--) {

            var wsId = roles[i].workspaceID.toString();

            if(selectedWorkspaces.indexOf(wsId) === -1) {
                roles.splice(i, 1);
            }


        }

    }

    console.log('           Roles : ' + roles.length); 

    if(options.extractSecurity)  fs.writeFile(options.folder + '/Security/roles.json', JSON.stringify(data, null, 3), function() {});
    
}
function parseGroups(data) {
    
    groups = data.list.group;

    console.log('          Groups : ' + groups.length); 

    if(options.extractSecurity)  fs.writeFile(options.folder + '/Security/groups.json', JSON.stringify(data, null, 3), function() {});  

}
function parsePermissions(data) {

    permissions = data.list.permission;
    workflowPermissions = [];

    for(var i = permissions.length - 1; i >= 0; i--) {

        if (typeof permissions[i].shortName === 'undefined') {        

            permissions.splice( i, 1 );

        } else if(permissions[i].shortName.indexOf('failed to localize') > -1) {

            let group = permissions[i].groupName;
            let short = permissions[i].shortName;

            if(group.startsWith('[failed to localize]')) group = group.substring(21);
            if(group.endsWith('()')) group = group.substring(0, group.length - 2);

            if(short.startsWith('[failed to localize]')) short = short.substring(21);
            if(short.endsWith('()')) short = short.substring(0, short.length - 2);

            var permission = {
                shortName : short,
                groupName : group,
                id        : permissions[i].id
            }

            if((group === 'Workflow Permission') || (group === 'Arbeitsablaufberechtigung')) {
                workflowPermissions.push(permission);
            }

            permissions.splice(i, 1 );
        }
    }

    permissions.sort(function(a, b){

        var akey = a.groupName + '.' + a.shortName;
        var bkey = b.groupName + '.' + b.shortName;

        return akey.localeCompare(bkey);

    });

    workflowPermissions.sort(function(a, b){
        return a.shortName.localeCompare(b.shortName);
    });
         
}


// Download Scripts
function downloadScripts() {
    
    if((options.extractScripts) && (indexScripts < scripts.length)) {
        
        downloadScript();
        
    } else {
        
        if(options.extractPicklists) {
            console.log();
            console.log();
            utils.print('Downloading Picklist Data');
            utils.printLine();
        }
        
        setTimeout(function () {
            downloadPicklists();
        }, delay); 
        
    }
    
}
function downloadScript() {
    
    let script      = scripts[indexScripts++];
    let scriptName  = script.uniqueName;
    let scriptType  = script.scriptType;
    let scriptUrn   = script.urn.split('.');
    let scriptId    = scriptUrn[scriptUrn.length - 1];
    let path        = options.folder + '/Scripts/' + scriptType + ' Scripts';
    let spacer      = '';
    
         if(indexScripts   < 10) spacer = '   ';
    else if(indexScripts  < 100) spacer = '  ';
    else if(indexScripts < 1000) spacer = ' ';
    
    utils.print('Saving script ' + spacer + indexScripts + ' of ' + scripts.length + ' : ' + scriptName);
    
    plm.downloadScript(scriptId).then(function(data) {
        fs.writeFile(path + '/' + scriptName + '.js', data.code, function() {
            downloadScripts();
        }); 
    });
    
}


// Download Picklists
function downloadPicklists() {
    
    if((options.extractPicklists) && (indexPicklists < picklists.length)) {
        downloadPicklist();
    } else {
        addSecurityDetails();   
    }
    
}
function downloadPicklist() {
    
    let picklist = picklists[indexPicklists++];
    
    if(options.extractPicklists){
            
        let spacer = '';
    
            if(indexPicklists   < 10) spacer = '   ';
        else if(indexPicklists  < 100) spacer = '  ';
        else if(indexPicklists < 1000) spacer = ' ';
        
        console.log('    Saving picklist ' + spacer + indexPicklists + ' of ' + picklists.length + ' : ' + picklist.name);
    
    }

    
    if(picklist.hasOwnProperty('workspaceId')) {
        
        if(options.extractPicklists){
            fs.writeFile(options.folder + '/Picklists/' + picklist.name + '.json', JSON.stringify(picklist, null, 3), function() {
                downloadPicklists();
            });
        } else {
            downloadPicklists();
        }
         
    } else {
        
        if(options.extractPicklists){
            
            plm.getPicklist(picklist.uri).then(function(data) {
                
                let picklistValues  = (typeof data.picklist.values !== 'undefined') ? data.picklist.values : [];
                let values          = [];
            
                if(picklistValues !== null) {
                    if(typeof picklistValues !== 'undefined') {
                        if(typeof picklistValues !== 'undefined') {
                            for(value of picklistValues) values.push(value.label);
                        }
                    } 
                }
                
                fs.writeFile(options.folder + '/Picklists/' + picklist.name + '.json', JSON.stringify(data, null, 3), function() {
                    picklist.count  = picklistValues.length;
                    picklist.values = values.toString();
                    downloadPicklists();
                });
                
            });
            
        } else {
            downloadPicklists();
        }
        
    }
    
}



// Get & Print Security Information

function addSecurityDetails() {

    var countGroups         = groups.length;
    var countRoles          = roles.length;
    var countUsers          = users.length;
    var countPermissions    = permissions.length;
    
    var colorOrange     = 'eb7d3c';
    var colorYellow     = 'ffb802';
    var colorBlue       = '4674c1';
    var colorGreen      = '72ac4d';
    var colorWorkflow   = '652b96';
    var colorGray       = 'f5f5f5';
    
    var backOrange      = 'fbe4d7';
    var backYellow      = 'ffefc5';
    var backGreen       = 'deedd5';
    var backWorkflow    = 'e5c2ff';

    setLayoutSecurity(countRoles, countUsers, countGroups, countPermissions);
   
    var borderBottom = wb.createStyle({
        border: { 
            bottom: { style: 'thin', color: '#' + colorGray }
        },
    });
    
    var borderLeft = wb.createStyle({
        border: { 
            left: { style: 'thin', color: '#' + colorGray }
        },
    });
    
    var styleVertical = wb.createStyle({
        alignment: {
            horizontal: 'center',
            textRotation: 90
        },
        border : {
            left : {
                style : 'thin',
                color: '#' + colorGray
            }
        },
        font : {
            color : '#666666',
            size : 11
        }
    });
    
    var styleHead = wb.createStyle({
        alignment: {
            horizontal: 'center',
            vertical : 'center'
        },
        font: {
            color: '#ffffff',
            size: 16
        },
        fill: { 
            type: 'pattern',
            patternType : 'solid'
        }
    });
    
    var styleSelected = wb.createStyle({
        alignment: {
            horizontal: 'center',
            vertical : 'center'
        },
        font: {
            size: 12
        },
        fill: { 
            type: 'pattern',
            patternType : 'solid'
        }
    });
    
    setRoles(countRoles, styleVertical, styleHead, colors[6]);
    setUsers(countRoles, countUsers, countGroups, styleVertical, styleHead, styleSelected, borderBottom, borderLeft, colorOrange, backOrange);
    setGroups(countGroups, countRoles, styleHead, styleSelected, borderBottom, borderLeft, colorYellow, backYellow);
    
    let iRow = setPermissions(permissions, roles, countGroups, countRoles, countPermissions, styleHead, styleSelected, borderBottom, borderLeft, colorGreen, backGreen, colorGray);
    setWorkflowPermissions(iRow, workflowPermissions, roles, countRoles, countPermissions, styleHead, styleSelected, borderBottom, borderLeft, colorWorkflow, backWorkflow);    
    
    console.log();
    console.log();
    console.log('    Processing Workspaces');
    console.log('   -------------------------------------------------------------------------------');

    getWorkspacesDetails();
    
}
function setLayoutSecurity(countRoles, countUsers, countGroups, countPermissions) {
    
    // Defined columns widths
    wsSecurity.column(1).setWidth(8);
    wsSecurity.column(2).setWidth(4);
    wsSecurity.column(3).setWidth(40);
    wsSecurity.column(3 + countRoles + 1).setWidth(6);
    
    // Freeze Pane
    wsSecurity.column(3).freeze();
    wsSecurity.row(2).freeze();
    
    // First row height
    wsSecurity.row(1).setHeight(40);
    
    // Default style without borders
    var styleDefault = wb.createStyle({
        border: { 
            left:   { style: 'thin', color: '#ffffff' },
            right:  { style: 'thin', color: '#ffffff' },
            top:    { style: 'thin', color: '#ffffff' },
            bottom: { style: 'thin', color: '#ffffff' }
        },
        font: {
            color : '#666666'
        }
    });
 
    wsSecurity.cell(1, 1, 150 + countGroups + countPermissions, 50 + countRoles + countUsers).style(styleDefault);
    
}
function setRoles(countRoles, styleVertical, styleHead, color) {
    
    wsSecurity.cell(1, 4, 1, 3 + countRoles, true).string('Roles').style(styleHead).style( { fill: { fgColor: color } } );
    wsSecurity.cell(1, 3 + countRoles, 2, 3 + countRoles).style( { border: { right: { style: 'thin', color: '#' + color } } } );
    
    var prevLetter = '';
    
    for(var i = 0; i < roles.length; i++) {
        var role = roles[i];
        var roleName = role.name;
        var firstLetter = roleName.substring(0, 1);
        
        if(firstLetter === prevLetter) {
            if(i < roles.length - 1) {
                wsSecurity.column(4 + i).group(1);
            }
        }
        
        wsSecurity.cell(2, 4 + i).string(roleName).style(styleVertical);
        wsSecurity.column(4 + i).setWidth(4);
        prevLetter = firstLetter;
    }
     
}
function setUsers(countRoles, countUsers, countGroups, styleVertical, styleHead, styleSelected, borderBottom, borderLeft, color, back) {
      
    wsSecurity.cell(4, 4 + countRoles + 1, 3 + countGroups, 4 + countRoles + countUsers).style(borderBottom);
    wsSecurity.cell(4, 4 + countRoles + 1, 3 + countGroups, 4 + countRoles + countUsers).style(borderLeft);
    
    var prevLetter = '';
    
    for(var i = 0; i < users.length; i++) {
        
        var user = users[i];
        var iCol = 4 + countRoles + 1 + i;
        var firstLetter = user.userName.substring(0, 1);

        wsSecurity.cell(2, iCol).string(user.userName).style(styleVertical);
        wsSecurity.column(iCol).setWidth(4);
        
        if(firstLetter === prevLetter) {
            if(i < users.length - 1) {
                wsSecurity.column(iCol).group(1);
            }
        }
        
        if(user.hasOwnProperty('groups')) { if(user.groups.hasOwnProperty('group')) {
            for(userGroup of user.groups.group) {
                for(var k = 0; k < groups.length; k++) {
                    if(userGroup.id === groups[k].id) {
                        wsSecurity.cell(4 + k, iCol).string('x').style(styleSelected).style( { font: { color : '#' + color }, fill: { fgColor: back } } );
                        break;
                    }
                }
            }
        } }
        
        prevLetter = firstLetter;
        
    }
    
    wsSecurity.cell(1, 4 + countRoles + 1, 1, 3 + countRoles + 1 + countUsers, true).string('Users').style(styleHead).style( { fill: { fgColor: color } } );
    wsSecurity.cell(1, 4 + countRoles + 1, 2, 4 + countRoles + 1).style( { border: { left: { style: 'thin', color: '#' + color } } } );
    wsSecurity.cell(1, 4 + countRoles + countUsers, 2, 4 + countRoles + countUsers).style( { border: { right: { style: 'thin', color: '#' + color } } } );
    
    wsSecurity.cell(4, 4 + countRoles + 1, 4, 4 + countRoles + countUsers).style({ border: { top: { style: 'thin', color: '#' + color } } });
    wsSecurity.cell(3 + countGroups, 4 + countRoles + 1, 3 + countGroups, 4 + countRoles + countUsers).style({ border: { bottom: { style: 'thin', color: '#' + color } } });
    wsSecurity.cell(4, 4 + countRoles + 1, 3 + countGroups, 4 + countRoles + 1).style({ border: { left: { style: 'thin', color: '#' + color } } });
    wsSecurity.cell(4, 4 + countRoles + countUsers, 3 + countGroups, 4 + countRoles + countUsers).style({ border: { right: { style: 'thin', color: '#' + color } } });
    
    
}
function setGroups(countGroups, countRoles, styleHead, styleSelected, borderBottom, borderLeft, color, back) {
    
    for(var i = 0; i < groups.length; i++) {

        wsSecurity.cell(4 + i, 2, 4 + i, 3, true).string(groups[i].name).style( { alignment: { indent : 2, vertical : 'center' } }); ;
        wsSecurity.cell(4 + i, 2, 4 + i, countRoles + 3).style(borderBottom);
        wsSecurity.cell(4 + i, 3, 4 + i, countRoles + 3).style(borderLeft);
        wsSecurity.row(4 + i).setHeight(20).group(1);

        if(groups[i].hasOwnProperty('roles')) { if(groups[i].roles.hasOwnProperty('role')) {
        
            var groupRoles = groups[i].roles.role;

            for(var j = 0; j < groupRoles.length; j++) {

                var groupRoleId = groupRoles[j].id;
                
                for(var k = 0; k < roles.length; k++) {
                    var roleId = roles[k].id;

                    if(groupRoleId === roleId) {
                        wsSecurity.cell(4 + i, 4 + k).string('x').style(styleSelected).style( { font: { color : '#' + color }, fill: { fgColor: back } } );
                        break;
                    }
                }
                
            }
        } }
        
    }

    wsSecurity.cell(4, 1, 3 + countGroups, 1, true).string('Groups').style(styleHead).style({ alignment: { vertical: 'center', textRotation: 90 }, fill: { fgColor: color } });
    wsSecurity.cell(4, 1, 4, countRoles + 3).style( { border : { top : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(4, countRoles + 3, countGroups + 3, countRoles + 3).style( { border : { right : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(countGroups + 3, 1, countGroups + 3, countRoles + 3).style( { border : { bottom : { style : 'thin', color : '#' + color } } } );
    
}
function setPermissions(permissions, roles, countGroups, countRoles, countPermissions, styleHead, styleSelected, borderBottom, borderLeft, color, back, colorGray) {
    
    var prevGroupName = '';
    var iRow          = 4 + countGroups;
    wsSecurity.row(iRow++).setHeight(30).group(1);
    
    for(var i = 0; i < permissions.length; i++) {
        
        var groupName = permissions[i].groupName;
        var shortName = permissions[i].shortName;
         
        if(groupName !== prevGroupName) {
            wsSecurity.cell(iRow, 2, iRow, 3 + countRoles).style(borderLeft).style( { fill: { type: 'pattern', patternType : 'solid', fgColor: colorGray } } );
            wsSecurity.cell(iRow, 2, iRow, 2).style( { alignment: { indent : 2, vertical : 'center' } } );
            wsSecurity.row(iRow).setHeight(20);
            wsSecurity.cell(iRow++, 2).string(groupName) ;
        } 
               
        wsSecurity.cell(iRow, 3).string(permissions[i].shortName);
        wsSecurity.cell(iRow, 4, iRow, 3 + countRoles).style(borderLeft);
        wsSecurity.cell(iRow, 2, iRow, 3 + countRoles).style(borderBottom);
        wsSecurity.row(iRow).group(1);
        
        
        var permId = permissions[i].id;
        
        for(var j = 0; j < roles.length; j++) {
            
            var role = roles[j];
            
            if(role.hasOwnProperty('permissions')) {
            
                var rolePermissions = role.permissions.permission;
                
                for(var k = 0; k < rolePermissions.length; k++) {
                    
                    var rolePermId = rolePermissions[k].id;
                    
                    if(rolePermId === permId) {
                        wsSecurity.cell(iRow, 4 + j).string('x').style(styleSelected).style( { font: { color : '#' + color }, fill: { fgColor: back } } );
                        break;
                    }
                    
                }
            }
        }
        
        iRow++;
        prevGroupName = groupName;
        
    }
    
    wsSecurity.cell(4 + countGroups + 1, 1, iRow - 1, 1, true).string('Permissions').style(styleHead).style({ alignment: { vertical: 'center', textRotation: 90 }, fill: { fgColor: color } });
    
    wsSecurity.cell(4 + countGroups + 1, 1, 4 + countGroups + 1, countRoles + 3).style( { border : { top : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(4 + countGroups + 1, countRoles + 3, iRow - 1, countRoles + 3).style( { border : { right : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(iRow - 1, 1, iRow -1, countRoles + 3).style( { border : { bottom : { style : 'thin', color : '#' + color } } } );
    
    return iRow;
    
}
function setWorkflowPermissions(iRow, workflowPermissions, roles, countRoles, countPermissions, styleHead, styleSelected, borderBottom, borderLeft, color, back) {
    
    wsSecurity.row(iRow++).setHeight(30);
    
    var prevName = '';
    var row = iRow;
    
    for(var i = 0; i < workflowPermissions.length; i++) {
        
        var workflowPermission = workflowPermissions[i];
        var name = workflowPermission.shortName;
        
        
        
        if(prevName !== name) {
            
            
            wsSecurity.cell(row, 2).string(name).style( { alignment: { indent : 2, vertical : 'center' } } );
            wsSecurity.cell(row, 4, row, 3 + countRoles).style(borderLeft);
            wsSecurity.cell(row, 2, row, 3 + countRoles).style(borderBottom);
            row += 1;
            
        }
        
        workflowPermission.row = row;
        
        prevName = name;
        
    }
        
    for(var i = 0; i < workflowPermissions.length; i++) {
        
        var permId = workflowPermissions[i].id;
        var name   = workflowPermissions[i].shortName;
        var row   = workflowPermissions[i].row;
        
       // console.log(' wfl permssio = ' + permId + ' - '+ name + ' - ');
        
        for(var j = 0; j < roles.length; j++) {
            
            var role = roles[j];
            
            if(role.hasOwnProperty('permissions')) {
            
                var rolePermissions = role.permissions.permission;
                
                for(var k = 0; k < rolePermissions.length; k++) {
                    
                    var rolePermId = rolePermissions[k].id;
                    
                    if(rolePermId === permId) {
                        wsSecurity.cell(row - 1, 4 + j).string('x').style(styleSelected).style( { font: { color : '#' + color }, fill: { fgColor: back } } );
                        break;
                    }
                    
                }
            }
            
        }
    }
    
    wsSecurity.cell(iRow, 1, row - 1, 1, true).string('Workflow Permissions').style(styleHead).style({ alignment: { vertical: 'center', textRotation: 90 }, fill: { fgColor: color } });
    wsSecurity.cell(iRow, 1, iRow, 3 + countRoles).style( { border : { top : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(iRow, 3 + countRoles, row - 1, 3 + countRoles).style( { border : { right : { style : 'thin', color : '#' + color } } } );
    wsSecurity.cell(row - 1, 1, row - 1, 3 + countRoles).style( { border : { bottom : { style : 'thin', color : '#' + color } } } );
    
    
}


// Print Workspaces Information
function getWorkspacesDetails() {

    if(index < workspaces.length) {
        getWorkspaceDetails();
    } else { 
        console.log();
        printAllScripts();
        printAllPicklists();
        printSystemLog(function() {
            printSetupLog(function() {
                if(options.createExcelFile) {
                    setLayoutFinal();
                    saveExcelFile(wb);                         
                } else {
                    closingMessage();
                }
            });
        });
    }
    
}
function getWorkspaceDetails() {
    
    let workspace   = workspaces[index];
    let workspaceId = workspace.id.toString();

    if((selectedWorkspaces.length === 0) || (selectedWorkspaces.indexOf(workspaceId) > -1)) {
        
        setTimeout(function () {
        
            let number = (index + 1);
            let spacer = '';

                 if(number   < 10) spacer = '   ';
            else if(number  < 100) spacer = '  ';
            else if(number < 1000) spacer = ' ';

            console.log('    Workspace ' + spacer + number + ' of ' + workspaces.length + ': ' + workspace.label + ' (' + workspaceId + ')');

            let requests = [
                plm.getWorkspaceType(workspaceId),
                plm.getWorkspaceTabs(workspaceId),
                plm.getWorkspaceScripts(workspaceId),
                plm.getWorkspaceSections(workspaceId),
                plm.getWorkspaceFields(workspaceId),
                plm.getWorkspaceGridColumns(workspaceId),
                plm.getWorkspaceManagedItemsColumns(workspaceId),
                plm.getWorkspacePrintViews(workspaceId),
                plm.getRelatedWorkspacesBOM(workspaceId),
                plm.getRelatedWorkspacesGantt(workspaceId),
                plm.getRelatedWorkspacesRelationships(workspaceId),
                plm.getRelatedWorkspacesManagedItems(workspaceId),
                plm.getWorkspaceStates(workspaceId),
                plm.getWorkspaceTransitions(workspaceId),
                plm.getWorkspaceSectionsFields(workspaceId)
            ];

            Promise.all(requests).then(function(wsData) {

                let wsConfig = {
                    'type'              : wsData[0].split('/')[4],
                    'tabs'              : wsData[1],
                    'scripts'           : wsData[2],
                    'sections'          : wsData[3],
                    'fields'            : wsData[4],
                    'grid'              : wsData[5],
                    'managedItems'      : wsData[6],
                    'printViews'        : wsData[7],
                    'wsBOM'             : wsData[8],
                    'wsGantt'           : wsData[9],
                    'wsRelationships'   : wsData[10],
                    'wsManagedItems'    : wsData[11],
                    'states'            : wsData[12],
                    'transitions'       : wsData[13],
                    'sectionFields'     : wsData[14],
                }

                if(wsConfig.fields.fields.length > 0) {
                
                    for(wsScript of wsConfig.scripts) {

                        let wsScriptURN = wsScript.urn.split('.');
                        let wsScriptId  = wsScriptURN[wsScriptURN.length - 1];

                        for(script of scripts) {

                            let scriptURN = script.urn.split('.');
                            let scriptId = scriptURN[scriptURN.length - 1];

                            if(wsScriptId === scriptId) {
                                script.inUse = 'true';
                                break;
                            }
                        }
                    }

                    // Print fields to file
                    if(options.extractFields) {
                        fs.writeFile(options.folder + '/Workspaces Fields/' + workspace.label + ' (' + workspace.id + ').json', JSON.stringify(wsConfig.fields, null, 3), function() {});
                    }

                    // Print grid columns to file
                    if((options.extractGrid) && (wsConfig.grid.fields.length > 0)) {
                        fs.writeFile(options.folder + '/Workspaces Grid Columns/' +  workspace.label + ' (' + workspace.id + ').json', JSON.stringify(wsConfig.grid, null, 3), function() {});
                    }

                    // Print managed items columns
                    if((options.extractManagedItems) && (wsConfig.managedItems.fields.length > 0)) {
                        fs.writeFile(options.folder + '/Workspaces Managed Items Columns/' + workspace.label + ' (' + workspace.id + ').json', JSON.stringify(wsConfig.managedItems, null, 3), function() {});
                    }

                    // Print workflow
                    if((options.extractWorkflow) && (wsConfig.states.length > 0)) {
                        fs.writeFile(options.folder + '/States/' + workspace.label + ' (' + workspace.id + ').json', JSON.stringify(wsConfig.states, null, 3), function() {});
                        fs.writeFile(options.folder + '/Transitions/' + workspace.label + ' (' + workspace.id + ').json', JSON.stringify(wsConfig.transitions, null, 3), function() {});
                    }

                    printWorkspaceDetails(workspace, wsConfig);  

                }

            });
            
        }, delay); 
        
        
    } else {

        index++;
        getWorkspacesDetails();
        
    }
    
}


// Print Workspace Information
function printWorkspaceDetails(workspace, wsConfig) {
    
    let countGridColumns    = 0;
    let fields              = sort(wsConfig.fields.fields, 'displayOrder'); 
    let workspaceRows       = 4;
    
    countWSFields = 0;
    
    if(wsConfig.tabs.length > workspaceRows) workspaceRows = wsConfig.tabs.length;
    
    wsWorkspaces.row(rowWorkspace).setHeight(28);
    
    wsWorkspaces.cell(rowWorkspace,  1, rowWorkspace,  2, true).style(styleWorkspace).string(workspace.label);
    wsWorkspaces.cell(rowWorkspace,  4, rowWorkspace,  5, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace,  7, rowWorkspace,  8, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace, 10, rowWorkspace, 11, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace, 13, rowWorkspace, 14, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace, colBaseDetails , rowWorkspace, colBaseGrid - 2, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace, colBaseGrid    , rowWorkspace, colBaseLast    , true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace, colBaseLast + 2, rowWorkspace, colBaseLast + 9, true).style(styleWorkspace);
    wsWorkspaces.cell(rowWorkspace + 1, 1).string('Category');
    wsWorkspaces.cell(rowWorkspace + 1, 2).string(workspace.category);
    wsWorkspaces.cell(rowWorkspace + 2, 1).string('ID');
    wsWorkspaces.cell(rowWorkspace + 2, 2).string(workspace.id.toString());
    wsWorkspaces.cell(rowWorkspace + 3, 1).string('Type');
    wsWorkspaces.cell(rowWorkspace + 3, 2).string(getWorkspaceTypeLabel(wsConfig.type));
    wsWorkspaces.cell(rowWorkspace + 1, 7).string('On Create');
    wsWorkspaces.cell(rowWorkspace + 2, 7).string('On Edit');
    

    printTabNames(wsConfig.tabs);
    printScripts(wsConfig.scripts);
    printRelationships(wsConfig);
    printAPVs(wsConfig.printViews);

    var rowWorkspaceField = rowWorkspace + 1;
        
    for(section of wsConfig.sectionFields) {
        for(sectionField of section.fields) {
            if(sectionField.type === 'MATRIX') {
                for(matrix of section.matrices) {
                    if(sectionField.urn === matrix.urn) {
                        for(matrixRow of matrix.fields) {
                            for(cell of matrixRow) {
                                if(cell !== null) {
                                    addWorkspaceField(cell.urn, fields, section.name, rowWorkspaceField);
                                    rowWorkspaceField++;
                                }
                            }
                        }
                        break;
                    }
                }
            } else {
                addWorkspaceField(sectionField.urn, fields, section.name, rowWorkspaceField);
                rowWorkspaceField++;
            } 
        }
    }

    if(wsConfig.grid.fields.length > 0) {
            
        let grid         = wsConfig.grid.fields;
        countGridColumns = grid.length;
        
        if(grid.length > workspaceRows) workspaceRows = grid.length;
    
        for(var i = 0; i < grid.length; i++) {

            let column  = grid[i];
            let urn     = column.urn.split('.');
            let colId   = urn[urn.length - 1];

            wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 0).string(column.name);
            wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 1).string(colId);

            if(column.hasOwnProperty('fieldDesc')) wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 2).string(column.description);

            wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 3).string(column.type.title);
            wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 6).string(column.editability);

            if(column.fieldLength !== null) wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 4).number(column.fieldLength);
            if(column.displayLength !== null) wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 5).number(column.displayLength);
            
            if(column.defaultValue !== null) {
                if(typeof column.defaultValue === 'object') {
                    wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 7).string(column.defaultValue.title);
                } else {
                    wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 7).string(column.defaultValue);
                }
            }
                
            if(column.picklist !== null) {
                
                let dataPicklist = column.picklist.split('/');
                let idPicklist = dataPicklist[dataPicklist.length - 1];
            
                for(picklist of picklists) {
                    if(idPicklist === picklist.id) {
                        picklist.inUse = true;
                        break;
                    }
                }
                
            }

        }

    }

    printManagedItemsColumns(wsConfig.managedItems, rowWorkspace, workspaceRows);
    
    if(countWSFields > workspaceRows) workspaceRows = countWSFields;
    
    // Storing field and column counter
    wsWorkspaces.cell(rowWorkspace, colBaseDetails).string(countWSFields + ' Fields').style({alignment:{horizontal:'center'}});
    wsWorkspaces.cell(rowWorkspace, colBaseGrid).string(countGridColumns + ' Columns').style({alignment:{horizontal:'center'}});

    if(workspaceRows < 3) workspaceRows = 3;
    
    setContentStyle(workspaceRows);
    rowWorkspace += (workspaceRows + 1);
    
    addWorkspaceStates(workspace, wsConfig.states);
    addWorkspaceTransistions(workspace, wsConfig.transitions);
    
    index++;
    getWorkspacesDetails();
    
};
function getWorkspaceTypeLabel(type) {
    
    let wsTypeLabel = '';
    
    switch(type) {
            
        case '1':
            wsTypeLabel = 'Basic';
            break; 
        
        case '2':
            wsTypeLabel = 'Basic with workflow';
            break;
        
        case '6':
            wsTypeLabel = 'Revision Controlled';
            break;
        
        case '7':
            wsTypeLabel = 'Revisioning';
            break; 
            
        case '8':
            wsTypeLabel = 'Supplier Management';
            break;
            
    }
    
    return wsTypeLabel;
    
}
function sort(data, key) {
    
    data.sort(function(a, b){
        var nameA=a[key], nameB=b[key]
        if (nameA < nameB)
            return -1 
        if (nameA > nameB)
            return 1
        return 0 
    });
    
    return data;
    
}
function addWorkspaceField(listFieldUrn, fields, sectionName, rowWorkspaceField) {
    
    for(var i = 0; i < fields.length; i++) {
        
        var field       = fields[i];
        var fieldUrn    = field.urn;

        if(listFieldUrn === fieldUrn) {
                    
            var fieldTemp = field.__self__.split('/');
            var fieldID   = fieldTemp[fieldTemp.length - 1];
                    
            var fieldLength         = (   field.fieldLength === null) ? '' : field.fieldLength.toString();
            var fieldLength         = (   field.fieldLength === null) ? '' : field.fieldLength.toString();
            var fieldDisplay        = ( field.displayLength === null) ? '' : field.displayLength.toString();
            var fieldDefault        = (  field.defaultValue === null) ? '' : field.defaultValue.toString();
            var fieldUom            = ( field.unitOfMeasure === null) ? '' : field.unitOfMeasure.toString();
            var fieldDerived        = (       field.derived === null) ? '' : field.derived.toString();
            var fieldPickList       = (      field.picklist === null) ? '' : 'Yes';
            var fieldValidation     = (    field.validators === null) ? '' : 'Yes';
            var fieldFormula        = '';
            var fieldDerivedSource  = '';
            var fieldPickList       = '';
                    
            if(fieldDerived === 'true') fieldDerivedSource = field.derivedFieldSource.title;
//            if(fieldDerived === 'true') {
//                console.log(field);
//                fieldDerivedSource = field.derivedFieldSource.title;
//            }
            if(field.hasOwnProperty('formulaField')) fieldFormula = ( field.formulaField === null) ? '' : field.formulaField.toString();
             
            if(field.picklist !== null) {
                
                let dataPicklist = field.picklist.split('/');
                let idPicklist = dataPicklist[dataPicklist.length - 1];
                
                for(picklist of picklists) {
                    if(idPicklist === picklist.id) {
                        picklist.inUse = true;
                        break;
                    }
                }
                
                var temp = field.picklist.split('/');
                fieldPickList = temp[temp.length - 1];
            }

            let fieldDescription = (field.description === null) ? '' : field.description;
            let fieldType        = (typeof field.type.title === 'undefined') ? '' : field.type.title;

            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  0).string(sectionName);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  1).string(field.name);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  2).string(fieldID);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  3).string(fieldDescription);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  4).string(fieldType);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  5).string(fieldUom);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  6).string(fieldPickList);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  7).string(fieldLength);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  8).string(fieldDisplay);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails +  9).string(field.editability);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 10).string(field.visibility);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 11).string(fieldDefault);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 12).string(fieldDerived);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 13).string(fieldDerivedSource);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 14).string(fieldFormula);
            wsWorkspaces.cell(rowWorkspaceField, colBaseDetails + 15).string(fieldValidation);
                  
            countWSFields++;
            
            break;   
                   
        }
    }
                    
}
function printTabNames(tabs) {
    
    for(let iTab = 0; iTab < tabs.length; iTab++) {
        
        let tab  = tabs[iTab];
        let key  = tab.key;
        let name = (tab.name === null) ? key : tab.name;
        
        wsWorkspaces.cell(rowWorkspace + iTab + 1, 4).string(key);
        wsWorkspaces.cell(rowWorkspace + iTab + 1, 5).string(name);
    } 
    
}
function printScripts(scripts) {
    
    if(scripts === null) return;

    let rowCustomSripts = 2;
    
    for(script of scripts) {
    
        let behavior = script.scriptBehaviorType;
        let name     = script.uniqueName;
        
        if(behavior === 'ON_CREATE') {
            wsWorkspaces.cell(rowWorkspace + 1, 8).string(name);
        } else if(behavior === 'ON_EDIT') {
            wsWorkspaces.cell(rowWorkspace + 2, 8).string(name);
        } else {
            rowCustomSripts++;
            wsWorkspaces.cell(rowWorkspace + rowCustomSripts, 7).string('On Demand');
            wsWorkspaces.cell(rowWorkspace + rowCustomSripts, 8).string(name);
        }
        
    }
    
}
function printAPVs(apvs) {
    
    if(apvs.length === 0) return;
    
    let rowNext = 1;
    
    for(apv of apvs) {
    
        let name    = apv.title;
        let hidden  = 'false';

        if(apv.hasOwnProperty('hidden')) hidden = apv.hidden.toString();
        
        wsWorkspaces.cell(rowWorkspace + rowNext, 13).string(hidden);
        wsWorkspaces.cell(rowWorkspace + rowNext, 14).string(name);
        
        rowNext++;
        
    }
    
}
function printRelationships(wsConfig) {
    
    var rowNext = 1;
    
    rowNext = printRelationship(rowNext, 'Relationships'        , wsConfig.wsRelationships);
    rowNext = printRelationship(rowNext, 'Managed Items'        , wsConfig.wsManagedItems);
    rowNext = printRelationship(rowNext, 'Bill of Materials'    , wsConfig.wsBOM);
    rowNext = printRelationship(rowNext, 'Project Management'   , wsConfig.wsGantt);
    
}
function printRelationship(rowNext, label, workspaces) {
    
    if(workspaces === null) return;
    
    for(var i = 0; i < workspaces.length; i++) {
    
        var workspace    = workspaces[i];
        var name         = workspace.title;
        
        wsWorkspaces.cell(rowWorkspace + rowNext, 10).string(label);
        wsWorkspaces.cell(rowWorkspace + rowNext, 11).string(name);
        
        rowNext++;
        
    }   
    
    return rowNext;
}
function printManagedItemsColumns(managedItemsColumns, rowWorkspace, workspaceRows) {

    if(managedItemsColumns.fields.length === 0) return;

    if(managedItemsColumns.fields.length > workspaceRows) workspaceRows = managedItemsColumns.fields.length;
    
    let columns = managedItemsColumns.fields;
    
    wsWorkspaces.cell(rowWorkspace, colBaseGrid + 10).string(managedItemsColumns.fields.length + ' Columns').style({alignment:{horizontal:'center'}});
    
    for(var i = 0; i < columns.length; i++) {
    
        var column = columns[i];
        let urn     = column.urn.split('.');
        let colId   = urn[urn.length - 1];
        
        wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid +  9).string(column.name);
        wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 10).string(colId);
        wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 11).string(column.description);
        wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 12).string(column.type.title);
        
        if(column.fieldLength   !== null) wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 13).number(column.fieldLength);
        if(column.displayLength !== null) wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 14).number(column.displayLength);
        
        wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 15).string(column.editability);
        
        if(column.defaultValue !== null) {
            if(typeof column.defaultValue === 'object') {
                wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 15).string(column.defaultValue.title);
            } else {
                wsWorkspaces.cell(rowWorkspace + i + 1, colBaseGrid + 15).string(column.defaultValue);
            }
        }
        
        if(column.picklist !== null) {

            let dataPicklist = column.picklist.split('/');
            let idPicklist = dataPicklist[dataPicklist.length - 1];

            for(picklist of picklists) {
                if(idPicklist === picklist.id) {
                    picklist.inUse = true;
                    break;
                }
            }

        }
        
    }
    
}
function setContentStyle(workspaceRows) {
    
    var styleLabel = wb.createStyle({
        alignment: {
            horizontal: 'right',
            vertical : 'center'
        },
        font: {
            color : '#bbbbbb'
        }
    });

    var styleRow = wb.createStyle({
        alignment: {
            indent : 1
        },
        border: { 
            right:  { style: 'thin', color: '#ffffff' },
            bottom: { style: 'thin', color: '#f5f5f5' },
            left:   { style: 'thin', color: '#ffffff' }
        }
    });
    
    for(var i = 0; i < workspaceRows; i++) {
        
        wsWorkspaces.row(rowWorkspace + 1 + i).setHeight(20).group(1);
        wsWorkspaces.cell(rowWorkspace + 1 + i, 1, rowWorkspace + 1 + i, 50).style( { alignment: { vertical : 'center'} } );
        
    }
    
    wsWorkspaces.cell(rowWorkspace + 1, 1, rowWorkspace + workspaceRows, 1).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 1, rowWorkspace + workspaceRows, 2).style(styleRow);
    
    wsWorkspaces.cell(rowWorkspace + 1, 4, rowWorkspace + workspaceRows, 4).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 4, rowWorkspace + workspaceRows, 5).style(styleRow);  
    
    wsWorkspaces.cell(rowWorkspace + 1, 7, rowWorkspace + workspaceRows, 7).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 7, rowWorkspace + workspaceRows, 8).style(styleRow);
    
    wsWorkspaces.cell(rowWorkspace + 1, 10, rowWorkspace + workspaceRows, 10).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 10, rowWorkspace + workspaceRows, 11).style(styleRow);  
    
    wsWorkspaces.cell(rowWorkspace + 1, 13, rowWorkspace + workspaceRows, 13).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 13, rowWorkspace + workspaceRows, 14).style(styleRow);
    
    wsWorkspaces.cell(rowWorkspace + 1, 16, rowWorkspace + workspaceRows, 16).style(styleLabel);
    wsWorkspaces.cell(rowWorkspace + 1, 16, rowWorkspace + workspaceRows, 17).style(styleRow);
    
    wsWorkspaces.cell(rowWorkspace + 1, colBaseDetails , rowWorkspace + workspaceRows, colBaseGrid - 2).style(styleRow);
    wsWorkspaces.cell(rowWorkspace + 1, colBaseGrid    , rowWorkspace + workspaceRows, colBaseLast).style(styleRow);
    wsWorkspaces.cell(rowWorkspace + 1, colBaseLast + 2, rowWorkspace + workspaceRows, colBaseLast + 9).style(styleRow);

    
}
function setLayoutFinal() {
    
    wsWorkspaces.cell(rowWorkspace, 1, rowWorkspace + 50, colBaseLast + 50).style(styleDefault);
    wsStates.cell(2, 1, rowState + 50, 6 + 50).style(styleDefault).style( { border: { bottom: { style: 'thin', color: '#f5f5f5' }}} );
    wsTransitions.cell(2, 1, rowTransition + 50, 15 + 50).style(styleDefault).style( { border: { bottom: { style: 'thin', color: '#f5f5f5' }}} );
    
    setBorder( 1,  2, 0);
    setBorder( 4,  5, 1);
    setBorder( 7,  8, 2);
    setBorder(10, 11, 3);
    setBorder(13, 14, 4);
    setBorder(colBaseDetails, colBaseGrid - 2, 6);
    setBorder(colBaseGrid, colBaseLast, 7);
    setBorder(colBaseLast + 2, colBaseLast + 9, 8);
    
    
    // WHITE SPACING CELLS
    clearBorders(3);
    clearBorders(6);
    clearBorders(9);
    clearBorders(12);
    clearBorders(15);
    clearBorders(colBaseDetails - 1);
    clearBorders(colBaseGrid - 1);
    clearBorders(colBaseGrid + 8);
    
    // Clear borders right to the table
    wsWorkspaces.cell(1, colBaseLast + 10, rowWorkspace + 50, 100).style({ 
        border: {
            top   : { style: 'thin', color: '#ffffff' },
            right : { style: 'thin', color: '#ffffff' },
            bottom: { style: 'thin', color: '#ffffff' },
            left  : { style: 'thin', color: '#ffffff' }
        } 
    });
    
     
}
function setBorder(left, right, color) {

    wsWorkspaces.cell(1, right, rowWorkspace - 1, right).style( { border: { right:   { style: 'thin', color: colors[color] }}} );
    wsWorkspaces.cell(rowWorkspace - 1, left, rowWorkspace - 1, right).style( { border: { bottom:   { style: 'thin', color: colors[color] }}} );
    wsWorkspaces.cell(1, left, rowWorkspace - 1, left).style( { border: { left:   { style: 'thin', color: colors[color] }}} );
    
}
function clearBorders(column) {
    
    wsWorkspaces.cell(1, column, rowWorkspace + 50, column).style( { border: { bottom:   { style: 'thin', color: '#ffffff' }}} );
    
}


// Print workflow information
function addWorkspaceStates(workspace, states) {

//    console.log(' addWorkspaceStates : START');
  
    if(states === null) return;
    
//    if(statesData.length > 0) {

//        for(var i = 0; i < statesData.length; i++) {
        for(state of states) {

//            var state = statesData[i];

            wsStates.cell(rowState, 1).string(workspace.label);
            wsStates.cell(rowState, 2).string(state.name);
            wsStates.cell(rowState, 3).string(state.customLabel);
            wsStates.cell(rowState, 4).bool(state.hidden);
            wsStates.cell(rowState, 5).bool(state.locked);
            wsStates.cell(rowState, 6).bool(state.managed);

            rowState++;

        }

//    }

//    addWorkspaceTransistions(function() {
//        callback();
//    });

}
function addWorkspaceTransistions(workspace, transitions) {

    for(transition of transitions) {

        var conditionScript     = (typeof transition.conditionScript  === 'undefined') ? '' : transition.conditionScript.title.toString();
        var validationScript    = (typeof transition.validationScript === 'undefined') ? '' : transition.validationScript.title.toString();
        var actionScript        = (typeof transition.actionScript     === 'undefined') ? '' : transition.actionScript.title.toString();
        var fromState           = (typeof transition.fromState        === 'undefined') ? '' : transition.fromState.title.toString();

        wsTransitions.cell(rowTransition,  1).string(workspace.label);
        wsTransitions.cell(rowTransition,  2).string(transition.name);
        wsTransitions.cell(rowTransition,  3).string(transition.customLabel);
        wsTransitions.cell(rowTransition,  4).string(fromState);
        wsTransitions.cell(rowTransition,  5).string(transition.toState.title);
        wsTransitions.cell(rowTransition,  6).string(transition.permission.title);
        wsTransitions.cell(rowTransition,  7).string(transition.comments);
        wsTransitions.cell(rowTransition,  8).bool(transition.sendEmail);
        wsTransitions.cell(rowTransition,  9).bool(transition.showInOutstanding);
        wsTransitions.cell(rowTransition, 10).bool(transition.notifyPerformers);
        wsTransitions.cell(rowTransition, 11).string(conditionScript);
        wsTransitions.cell(rowTransition, 12).string(validationScript);
        wsTransitions.cell(rowTransition, 13).string(actionScript);
        wsTransitions.cell(rowTransition, 14).bool(transition.passwordEnabled);
        wsTransitions.cell(rowTransition, 15).bool(transition.hidden);
        
        setScriptUsage(conditionScript);
        setScriptUsage(validationScript);
        setScriptUsage(actionScript);

        rowTransition++;

    }

}
function setScriptUsage(scriptName) {
 
    for(script of scripts) {
        if(script.uniqueName === scriptName) {
            script.inUse = 'true';
            return;
        }
    }
    
}


// Print scripts
function printAllScripts() {
    
    console.log('    Adding scripts to Excel file');
 
    for(var i = 0; i < scripts.length; i++) {

        let script = scripts[i];
        
        for(var j = 0; j < script.dependsOn.length; j++) {
            var include = script.dependsOn[j].title;
            setScriptUsage(include);
            
        }
        
    }
    
    // for(var i = 0; i < scripts.length; i++) {
    for(script of scripts) {

        // console.log(script);

        // let script      = scripts[i];
        let behavior    = (typeof script.scriptBehaviorType  === 'undefined') ? '' : script.scriptBehaviorType.toString();
        let includes    = '';
        
        // for(var j = 0; j < script.dependsOn.length; j++) {
        for(include of script.dependsOn) {
            if(includes.length !== '') include += ', ';
            includes += include.title;
        }
        
        wsScripts.cell(rowScript,  1).string(script.scriptType);
        wsScripts.cell(rowScript,  2).string(script.uniqueName);
        wsScripts.cell(rowScript,  3).string(behavior);
        wsScripts.cell(rowScript,  4).number(script.version);
        wsScripts.cell(rowScript,  5).string(script.inUse);
        wsScripts.cell(rowScript,  6).string(includes);

        rowScript++;
        
    }
    
    wsScripts.cell(2, 1, rowScript + 50, 5 + 50).style(styleDefault).style( { border: { bottom: { style: 'thin', color: '#f5f5f5' }}} );
    
}


// Print picklists
function printAllPicklists() {
    
    console.log('    Adding picklists to Excel file');
 
    for(picklist of picklists) {
        
        wsPicklists.cell(rowPicklist,  1).string(picklist.name);
        wsPicklists.cell(rowPicklist,  2).string(picklist.id);
        wsPicklists.cell(rowPicklist,  3).bool(picklist.inUse);
        wsPicklists.cell(rowPicklist,  7).string(picklist.uri);
        
        if(picklist.hasOwnProperty('workspaceId')) {
            wsPicklists.cell(rowPicklist,  6).number(picklist.workspaceId);
        } else if(picklist.count !== -1) {
            wsPicklists.cell(rowPicklist,  4).number(picklist.count);
            wsPicklists.cell(rowPicklist,  5).string(picklist.values);
        } else {
            wsPicklists.cell(rowPicklist,  4).string('Set exports.extractPicklists to true in settings to retrieve value count and list of values').style( { font : { italics: true } } );
        }

        rowPicklist++;
        
    }
    
    wsPicklists.cell(2, 1, rowPicklist + 50, 5 + 50).style(styleDefault).style( { border: { bottom: { style: 'thin', color: '#f5f5f5' }}} );
    
}


// Print log entries
function printSystemLog(callback) {
    
    if(options.limitSystemLog > 0) {

        plm.getSystemLog({ 'limit' : options.limitSystemLog }).then(function(response) {

            fs.writeFile(options.folder + '/Logs/system-log.json', JSON.stringify(response.data, null, 3), function() {
                
                console.log('    Adding ' + response.data.items.length + ' out of ' + response.data.totalCount + ' total system log entries');

                let row = 2;

                for(item of response.data.items) {

                    let invoker     = (item.hasOwnProperty('actionInvoker')) ? item.actionInvoker : '';
                    let descriptor  = (item.hasOwnProperty('item')) ? item.item.title : '';
                    let fieldName   = '';
                    let oldValue    = '';
                    let newValue    = '';

                    if(item.details.length > 0) {
                        fieldName   = item.details[0].fieldName;
                        oldValue    = item.details[0].oldValue;
                        newValue    = item.details[0].newValue;
                    }

                    if(fieldName === null) fieldName = '';
                    if(oldValue  === null) oldValue  = '';
                    if(newValue  === null) newValue  = '';

                    wsSystemLog.cell(row, 1).date(item.timestamp);
                    wsSystemLog.cell(row, 2).string(item.user.title);
                    wsSystemLog.cell(row, 3).string(item.action);
                    wsSystemLog.cell(row, 4).string(invoker);
                    wsSystemLog.cell(row, 5).string(descriptor);
                    wsSystemLog.cell(row, 6).string(fieldName);
                    wsSystemLog.cell(row, 7).string(oldValue).style( { wrapText: true } );;
                    wsSystemLog.cell(row, 8).string(newValue).style( { wrapText: true } );;

                    row++;

                }

                wsSystemLog.cell(2, 1, row + 100, 8 + 100).style(styleDefault).style({ 
                    border: { bottom: { style: 'thin', color: '#f5f5f5' }},
                    alignment : { vertical : 'center' }
                });

                callback();

            });        
        });        

    } else { callback(); }
    
}
function printSetupLog(callback) {
    
    if(options.limitSetupLog > 0) {
    
        plm.getSetupLog({ 'limit' : options.limitSetupLog }).then(function(response) {

            fs.writeFile(options.folder + '/Logs/setup-log.json', JSON.stringify(response, null, 3), function() {
            
                console.log('    Adding ' + response.items.length + ' out of ' + response.totalCount + ' total setup log entries');

                let row = 2;

                for(item of response.items) {

                    var details = [];

                    for(detail of item.details) {
                        
                        if(details.length > 0) details.push('\r\n');

                        details.push(detail.description);

                        if(details.length > 20) {
                            details.push('\r\n[...' + (item.details.length - 20 ) + ' more entries]');
                            break;
                        }

                    }


                    wsSetupLog.cell(row, 1).date(item.timestamp);
                    wsSetupLog.cell(row, 2).string(item.user.title);
                    wsSetupLog.cell(row, 3).string(item.sectionOrWorkspace);
                    wsSetupLog.cell(row, 4).string(item.action);
                    wsSetupLog.cell(row, 5).string(details).style( { alignment : { wrapText: true } } );

                    row++;
                }

                wsSetupLog.cell(2, 1, row + 100, 5 + 100).style(styleDefault).style({ 
                    border: { bottom: { style: 'thin', color: '#f5f5f5' }},
                    alignment : { vertical : 'center' }
                });

                callback();

            });

        });
        
    } else { callback(); }
    
}


// Save Output file
function saveExcelFile(wb) {

    let fileName = options.folder + '/Configuration' + ' ' + tenant.toUpperCase();

    if(options.appendDate) {
        fileName += ' ' + now.getFullYear()
        fileName += '-' + month
        fileName += '-' + day
        fileName += ' ' + hours
        fileName += '-' + minutes
        fileName += '-' + seconds
    }

    fileName += '.xlsx'
     
    wb.write(fileName);
    
    console.log();      
    utils.print('Excel file saved to ' + fileName);
    utils.printEnd();
    
}