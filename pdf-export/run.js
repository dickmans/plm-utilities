// CONVERT ADVANCED PRINT VIEW TO PDF
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-04-14: Fixed issue with multiple authentication headers during file upload
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-02-01: Enable matrices with tables
    - 2022-02-01: Fixed issue with flat BOM
    - 2022-02-01: Fixed issue with folder creation
    - 2022-02-01: Fixed issue with printDate element in APV
    - 2021-05-28: Initial Version
   -------------------------------------------------------------------------------------------------------- */


const options       = require('./options.js');
const utils         = require('../node_modules_adsk/utils.js');
const f3m           = require('../node_modules_adsk/f3m.js');
const fs            = require('fs');
const pdf           = require('html-pdf');
const parser        = require('node-html-parser');
const apv           = fs.readFileSync('templates/' + options.template, 'utf8');


let apvRoot         = parser.parse(apv, { style : true } ) ;
let records         = [];
let counter         = 0;
let total           = 0;
let limit           = 50;
let tabLabels       = ['Item Details', 'Managed Items', 'Attachments', 'Grid', 'Project Management', 'Workflow Actions', 'Milestones', 'Change Log'];
let colsGrid        = [];

let fileName, dmsId;

utils.printStart([
    [ 'Template' , options.template],
    [ 'Output Folder' , options.output],
    [ 'Upload Report' , options.uploadReport],
    [ 'Upload Folder' , options.uploadFolder],
    [ 'Workspace ID' , options.workspaceId],
    [ 'DMS ID' , options.dmsId],
    [ 'Field ID'     , options.fieldId],
    [ 'Field Value'     , options.fieldValue],
    [ 'Workflow Status'  , options.status],
    [ 'Transition ID', options.transitionId]
]);




f3m.login(false).then(function() {

    utils.createFolder(options.output);

    let now = new Date();
    let printDate = apvRoot.querySelector('#printDate');

    if(printDate !== null) {
        apvRoot.querySelector('#printDate').set_content(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
    }

    utils.print('Getting tab labels');

    f3m.getWorkspaceTabs(options.workspaceId).then(function(data) {

        for(tab of data) {

            let key     = tab.key;
            let index   = tabLabels.indexOf(key);
            let label   = (tab.name === null) ? tabLabels[index] : tab.name;
    
            tabLabels[index] = label;
        }

        searchRecords();

    });

});


function searchRecords() {
    
    console.log();

    if (process.argv.length >  2) {
        records.push(process.argv[2]);
    }

    if(options.dmsId !== '') {
        records.push(options.dmsId);
        total++;
    }

    let filter = [];

    if(options.status !== '') {
        filter.push({ 
            fieldID     : 'WF_CURRENT_STATE',
            fieldTypeID : '1',
            filterType  : { filterID: '3' },
            filterValue : options.status 
        });
    }

    if(options.fieldId !== '') {
        if(options.fieldValue !== '') {
            filter.push({ 
                fieldID     : options.fieldId,
                fieldTypeID : '0',
                filterType  : { filterID: '3' },
                filterValue : options.fieldValue 
            });
        }
    }

    if(filter.length > 0) {
        
        utils.print('Searching for records in workspace ' + options.workspaceId + ' in status ' + options.status);

        let params = {
            'wsId'          : options.workspaceId,
            'pageNo'      : 1,
            'pageSize'    : limit,
            'logicClause' : 'AND',
            'fields'      : [ 
                { fieldID: 'WF_CURRENT_STATE', fieldTypeID: 1 }
            ],
            'filter' : filter,
            'sort' : [{
                'fieldID'        : 'WF_CURRENT_STATE',
                'fieldTypeID'    : 1,
                'sortDescending' : false
            }]
        }

        f3m.search(params).then(function(data) {
            console.log('    Found ' + data.row.length + ' records to process');
            for(let index = 0; index < data.row.length; index++) {
                records.push(data.row[index].dmsId);
            }
            total = records.length;
            processRecords();
        });

    } else processRecords();
     
}


// Process each record defined
function processRecords() {

    if(records.length === 0) {

        console.log();
        utils.print('Finished processing ' + counter + ' of ' + total + ' records');
        utils.printEnd();

    } else {
        dmsId = records[0];
        processRecord();
    }

}
function processRecord() {

    console.log();
    utils.print('Processing record ' + ++counter + ' of ' + total); 
    utils.printLine();

    apvRoot = parser.parse(apv, { style : true}) ;

    let requests = [f3m.getDetails(options.workspaceId, dmsId)];

    if(apvRoot.querySelectorAll('.attachments').length       > 0) { requests.push(f3m.getAttachments(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.grid').length              > 0) { requests.push(f3m.getWorkspaceGridColumns(options.workspaceId));
                                                                    requests.push(f3m.getGridRows(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.linkedItems').length       > 0) { requests.push(f3m.getWorkspaceManagedItemsColumns(options.workspaceId));
                                                                    requests.push(f3m.getManagedItems(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.milestones').length        > 0) { requests.push(f3m.getMilestones(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.changeLog').length         > 0) { requests.push(f3m.getChangeLog(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.projectManagement').length > 0) { requests.push(f3m.getProject(options.workspaceId, dmsId)); }
    if(apvRoot.querySelectorAll('.flatBom').length           > 0) { requests.push(f3m.getBOMViews(options.workspaceId)); }

    Promise.all(requests).then(function(results) {
  
        let index = 0;
        fileName = results[0].title + '.pdf'

        setDescriptor(results[index].title);
        processSections(results[index].sections);

        if(apvRoot.querySelectorAll('.attachments').length > 0) processAttachments(results[++index]);
        if(apvRoot.querySelectorAll('.grid').length > 0) {
            processGridColumns(results[++index]);
            processGridRows(results[++index]);
        }
        if(apvRoot.querySelectorAll('.linkedItems').length > 0) processManagedItems(results[++index], results[++index]);
        if(apvRoot.querySelectorAll('.milestones').length > 0) processMilestones(results[++index]);
        if(apvRoot.querySelectorAll('.changeLog').length > 0) processChangeLog(results[++index]);
        if(apvRoot.querySelectorAll('.projectManagement').length > 0) processProject(results[++index]);
        if(apvRoot.querySelectorAll('.flatBom').length > 0) {
            processFlatBOM(results[++index]);
        } else {
            postProcess();
        }
    });

}


// Process Item Details
function setDescriptor(title) {
    
    apvRoot.querySelector('#phDescriptor').set_content(title);

}
function processSections(sections) {

    for(elemSection of apvRoot.querySelectorAll('.section')) {
        for(elemTable of elemSection.childNodes) {
            for(tableRows of elemTable.childNodes) {
                for(tableRow of tableRows.childNodes) {
                    for(tableCell of tableRow.childNodes) {

                        let tagName = tableCell.rawTagName;
                        
                        if(typeof tagName !== 'undefined') {
                            
                            if(tagName === 'th') {
                                if((tableCell.classNames.length > 0) && (tableCell.classNames.indexOf('header') > -1)) {
                                    setSectionTitle(tableCell);
                                } else {
                                    setFieldLabel(sections, tableCell);    
                                }
                            } else if(tagName === 'td') {
                                let hasHTML = false;
                                for(node of tableCell.childNodes) {
                                    if(node.nodeType === 1) {
                                        hasHTML = true;
                                        break;
                                    }
                                }
                                if(!hasHTML) {
                                    setFieldValue(sections, tableCell);
                                } else {
                                    let cells = tableCell.querySelectorAll('td');
                                    for(cell of cells) {
                                        setFieldValue(sections, cell);
                                    }
                                    // console.log(tableCell.querySelectorAll('td').length);
                                }
                            }
                            
                        }
                        
                    }
            
                }
            }
        }
    }
    
}
function setSectionTitle(tableCell) {

    let sectionTitle  = tableCell.childNodes[0].rawText;
    let params      = sectionTitle.split('"');

    tableCell.childNodes[0].rawText = params[1];
    
}
function setFieldLabel(sections, tableCell) {
    
    let fieldLabel  = tableCell.childNodes[0].rawText;
    let params      = fieldLabel.split('.');
    let temp1       = fieldLabel.split('["');
    let temp2       = temp1[1].split('"]');

    for(section of sections) {

        if(section.title === temp2[0]) {

            for(field of section.fields) {

                let fieldParams = field.urn.split('.');

                if(params[5] === fieldParams[fieldParams.length - 1]) {
                    tableCell.childNodes[0].rawText = field.title;
                }

            }

        }

    }
    
}
function setFieldValue(sections, tableCell) {

    let rawText     = tableCell.childNodes[0].rawText;

    if(rawText.indexOf('.sections[') > 0) {

        let params      = rawText.split('.');
        let temp1       = rawText.split('["');
        let sectionName = temp1[1].split('"]')[0];
            
        for(section of sections) {

            if(section.title === sectionName) {

                for(field of section.fields) {

                    let fieldParams = field.urn.split('.');

                    if(params[4] === fieldParams[fieldParams.length - 1]) {

                        let value = '';

                        if(field.value !== null) {
                            if(typeof field.value === 'object') value = field.value.title;
                            else {
                                value = field.value;
                                if(typeof value === 'string') {
                                    value = value.replace(/&lt;/g, '<');
                                    value = value.replace(/&gt;/g, '>');
                                }
                            }

                        }

                        tableCell.childNodes[0].rawText = value;
                    }

                }

            }

        }
    }
    
}


// Process Item Attachments 
function processAttachments(attachments) {
    
    let elemAttachments  = '<div class="heading">' + tabLabels[2] + '</div>';
        elemAttachments += '<table class="table">';
        elemAttachments += '<tr><th>Filename</th><th>Version</th><th class="qty">Size</th><th class="qty">Date</th><th>User</th></tr>';
        
    if(attachments !== '') {

        for(attachment of attachments.attachments) {
                
            let timestamp   =  new Date(attachment.created.timeStamp);
                
            elemAttachments += '<tr>';
            elemAttachments += '<td>' + attachment.name + '</td>';
            elemAttachments += '<td class="align-right">' + attachment.version + '</td>';
            elemAttachments += '<td class="align-right">' + attachment.size + '</td>';
            elemAttachments += '<td class="align-right">' + timestamp.toLocaleString() + '</td>';
            elemAttachments += '<td class="align-right">' + attachment.created.user.title + '</td></tr>';
                
        }

    } else {

        elemAttachments += '<tr>';
        elemAttachments += '<td colspan="5" style="text-align:center;font-style:italic;">No attachments available</td>';
        elemAttachments += '<tr>';

    }
        
    elemAttachments += '</table>';
    apvRoot.querySelectorAll('.attachments')[0].set_content(elemAttachments);
        
}


// Process Item Grid
function processGridColumns(data) {

    for(field of data.fields) {

        let fieldURN = field.urn.split('.');
        let fieldID  = fieldURN[fieldURN.length - 1];

        colsGrid.push({
            'id' : fieldID,
            'label' : field.name
        });

    }

}
function processGridRows(data) {

    let headers = apvRoot.querySelectorAll('.grid th');
    let cells   = apvRoot.querySelectorAll('.grid td');

    let elemGrid  = '<div class="heading">' + tabLabels[3] + '</div>';
        elemGrid += '<table class="table">';
        elemGrid += '<tr>';

    for(let index = 1; index < headers.length; index++) {

        let temp = headers[index].childNodes[0].rawText.split('.');
        let label = temp[4];

        if(label !== 'title') {
            if(label !== 'rowID') {
                for(col of colsGrid) {
                    if(col.id === label) {
                        label = col.label;
                        break;
                    }
                }
                elemGrid += '<th>' + label + '</th>';
            }
        }

    }

    elemGrid += '</tr>';

    for(row of data.rows) {

        elemGrid += '<tr>';

        for(let indexCells = 1; indexCells < cells.length; indexCells++) {

            let temp = cells[indexCells].childNodes[0].rawText.split('.');
            let key = temp[1];

            elemGrid += '<td>';

            for(rowData of row.rowData) {

                let rowDataTemp = rowData.urn.split('.');
                let rowDataKey  = rowDataTemp[rowDataTemp.length - 1];
                
                if(rowDataKey === key) {

                    let cellValue = rowData.value;

                    if(typeof cellValue === 'object') cellValue = cellValue.title;

                    elemGrid += cellValue;
                    break;
                }

            }

            elemGrid += '</td>';

        }

        elemGrid += '</tr>';
        
    }
        
    elemGrid += '</table>';
    apvRoot.querySelectorAll('.grid')[0].set_content(elemGrid);

}


// Process Item Managed Items
function processManagedItems(columns, data) {
    
    let colsTable = [];

    for(field of columns.fields) {

        let fieldURN = field.urn.split('.');
        let fieldID  = fieldURN[fieldURN.length - 1];

        colsTable.push({
            'id' : fieldID,
            'label' : field.name
        });

    }

    let headers = apvRoot.querySelectorAll('.linkedItems th');
    let cells   = apvRoot.querySelectorAll('.linkedItems td');

    let elemTable  = '<div class="heading">' + tabLabels[1] + '</div>';
        elemTable += '<table class="table">';
        elemTable += '<tr>';
        elemTable += '<th>#</th>';
        elemTable += '<th>Item</th>';

    for(let index = 3; index < headers.length; index++) {

        let temp = headers[index].childNodes[0].rawText.split('.');
        let label = temp[4];

        if(label !== 'title') {
            if(label !== 'rowID') {
                for(col of colsTable) {
                    if(col.id === label) {
                        label = col.label;
                        break;
                    }
                }
                elemTable += '<th>' + label + '</th>';
            }
        }

    }

    elemTable += '</tr>';

    let indexRow = 1;

    if(data !== '') {

        for(row of data.affectedItems) {

            elemTable += '<tr>';
            elemTable += '<td>' + indexRow++ + '</td>';
            elemTable += '<td>' + row.item.title + '</td>';

            for(let indexCells = 2; indexCells < cells.length; indexCells++) {

                let temp = cells[indexCells].childNodes[0].rawText.split('.');
                let key = temp[1];

                elemTable += '<td>';

                for(rowData of row.linkedFields) {

                    let rowDataTemp = rowData.urn.split('.');
                    let rowDataKey  = rowDataTemp[rowDataTemp.length - 1];
                    
                    if(rowDataKey === key) {

                        let cellValue = rowData.value;

                        if(typeof cellValue === 'object') cellValue = cellValue.title;

                        elemTable += cellValue;
                        break;
                    }

                }

                elemTable += '</td>';

            }

            elemTable += '</tr>';
            
        }
    }
        
    elemTable += '</table>';
    apvRoot.querySelectorAll('.linkedItems')[0].set_content(elemTable);
        
}


// Process Item Milestones
function processMilestones(data) {

    let elemMilestones  = '<div class="heading">Milestones</div>';
        elemMilestones += '<table class="table">';
        elemMilestones += '<tr><th>Workflow State</th><th>Event</th><th>Target Date</th><th>Status</th><th>Warning Days</th><th>Progress</th></tr>';
        
    if(data !== '') {

        for(milestone of data.milestones) {
                
            let classStatus = 'highlightGreen';

            if(milestone.statusFlag === 'CRITICAL') classStatus = 'highlightRed';
            else if(milestone.statusFlag === 'WARNING') classStatus = 'highlightYellow';
                
            elemMilestones += '<tr>';
            elemMilestones += '<td class="align-right">' + milestone.workflowState.title + '</td>';
            elemMilestones += '<td class="align-right">' + milestone.type.title + '</td>';
            elemMilestones += '<td class="align-right">' + milestone.date.toLocaleString() + '</td>';
            elemMilestones += '<td class="align-right ' + classStatus + '">' + milestone.daysFromTargetDate + '</td>';
            elemMilestones += '<td class="align-right">' + milestone.warnThreshold + '</td>';
            elemMilestones += '<td class="align-right">' + milestone.progress + '</td></tr>';
                
        }

    } else {

        elemMilestones += '<tr>';
        elemMilestones += '<td colspan="6" style="text-align:center;font-style:italic;">No milestones available</td>';
        elemMilestones += '<tr>';

    }
        
    elemMilestones += '</table>';
    apvRoot.querySelectorAll('.milestones')[0].set_content(elemMilestones);
        
}


// Process Item Change Log
function processChangeLog(data) {

    let elemChangeLog  = '<div class="heading">' + tabLabels[7] + '</div>';
        elemChangeLog += '<table class="table">';
        elemChangeLog += '<tr>';
        elemChangeLog += '<th>Date</th>';
        elemChangeLog += '<th>User</th>';
        elemChangeLog += '<th>Description</th>';
        elemChangeLog += '</tr>';
    
    for(entry of data.items) {
        
        let timestamp   =  new Date(entry.timeStamp);
        let description = entry.description;
        
        if(description === null) {
            description = 'Changed field ' + entry.details[0].fieldName;
        }
        
        elemChangeLog += '<tr>';
        elemChangeLog += '<td>' + timestamp.toLocaleString() + '</td>';
        elemChangeLog += '<td>' + entry.user.title + '</td>';
//                elemChangeLog += '<td>' + entry.action.shortName + '</td>';
        elemChangeLog += '<td>' + description + '</td>';
        elemChangeLog += '</tr>';
            
    }
        
    elemChangeLog += '</table>';
    apvRoot.querySelectorAll('.changeLog')[0].set_content(elemChangeLog);
        
}


// Process Item Project Management
function processProject(data) {
    
    let startDate = new Date();
        startDate.setDate(startDate.getDate() + 10000);

    let endDate = new Date();
        endDate.setDate(endDate.getDate() - 10000);
    
    let elemGantt  = '<div class="heading">' + tabLabels[4] + '</div><div id="gantt">';
    let elemActivities  = '<div class="column data"><div class="column-head">Activity</div>';
    let elemStart  = '<div class="column data"><div class="column-head">Start</div>';
    let elemEnd  = '<div class="column data"><div class="column-head">End</div>';
    let elemProgress  = '<div class="column data"><div class="column-head">Progress</div>';
            
    for(projectItem of data.projectItems) {
    
        let itemStart = new Date(projectItem.startDate);
        let itemEnd   = new Date(projectItem.endDate);
        
        if(itemStart.getTime() < startDate.getTime()) startDate = new Date(itemStart.getTime());
        if(  itemEnd.getTime() >   endDate.getTime()) endDate   = new Date(  itemEnd.getTime());
                    
        elemActivities  += '<div class="column-cell">'       + projectItem.title + '</div>';
        elemStart       += '<div class="column-cell align-right">'  + convDate(projectItem.startDate) + '</div>';
        elemEnd         += '<div class="column-cell align-right">'  + convDate(projectItem.endDate) + '</div>';
        elemProgress    += '<div class="column-cell align-right">'  + projectItem.progress + '</div>';
        
        if(projectItem.hasOwnProperty('projectItems')) {
            for(subItem of projectItem.projectItems) {
                
                elemActivities  += '<div class="column-cell sub-task">'    + subItem.title + '</div>';
                elemStart       += '<div class="column-cell align-right">' + convDate(subItem.startDate) + '</div>';
                elemEnd         += '<div class="column-cell align-right">' + convDate(subItem.endDate) + '</div>';
                elemProgress    += '<div class="column-cell align-right">' + subItem.progress + '</div>';
            
            }
        }
        
    }
    
    elemGantt += elemActivities + '</div>';
    elemGantt += elemStart      + '</div>';
    elemGantt += elemEnd        + '</div>';
    elemGantt += elemProgress   + '</div>';
    
    startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(  endDate.getDate() + 7);
    
    var weekDate = new Date(startDate.getTime());
    
    do {
        
        var currentThursday = new Date(weekDate.getTime() +(3-((weekDate.getDay()+6) % 7)) * 86400000);
        var yearOfThursday  = currentThursday.getFullYear();
        var firstThursday   = new Date(new Date(yearOfThursday,0,4).getTime() +(3-((new Date(yearOfThursday,0,4).getDay()+6) % 7)) * 86400000);
        var weekNumber      = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000/7);

        weekDate.setDate(weekDate.getDate() + 7);
        
        var dateMonday = new Date(currentThursday.getTime());
            dateMonday.setDate(dateMonday.getDate() - dateMonday.getDay() + 1);
        
        var dateFriday = new Date(dateMonday.getTime());
            dateFriday.setDate(dateFriday.getDate() + 4);
        
        elemGantt += '<div class="column week">'
        elemGantt += '<div class="column-head">W'
        elemGantt += weekNumber;
        elemGantt += '<br/>' + dateMonday.getDate() + '.' + (dateMonday.getMonth() + 1);
        elemGantt += '</div>';
        
        for(projectItem of data.projectItems) {
    
            elemGantt += '<div class="column-cell ';
            elemGantt += (projectItem.hasOwnProperty('projectItems')) ? ' phase ' : ' task ';
            elemGantt += '">';
            elemGantt += getBar(dateMonday, dateFriday, projectItem.startDate, projectItem.endDate);
            elemGantt += '</div>';

            if(projectItem.hasOwnProperty('projectItems')) {
                for(subItem of projectItem.projectItems) {
                    elemGantt += '<div class="column-cell task '
                    elemGantt += '">'
                    elemGantt += getBar(dateMonday, dateFriday, subItem.startDate, subItem.endDate);
                    elemGantt += '</div>';
                }
            }
        
        }
        
        elemGantt += '</div>';

    } while (weekDate.getTime() <= endDate.getTime());
    
    elemGantt += '</div>';
    
    apvRoot.querySelectorAll('.projectManagement')[0].set_content(elemGantt);
        
}
function convDate(dateString) {
    
    var date = new Date(dateString);
    var month = date.getMonth() + 1;
    var result = '';
    
    if(date.getDate() < 10) result += '0';
    
    result += date.getDate() + '.';
    
    if(month < 10) result += '0';
    
    return result + month + '.' + date.getFullYear();
    
}
function getBar(monday, friday, start, end) {
    
    let startDate = new Date(start);
    let endDate   = new Date(end);
    
         if(   endDate.getTime() <  monday.getTime()) return '<div class="bar"></div>';
    else if( startDate.getTime() >  friday.getTime()) return '<div class="bar"></div>';
    else if((startDate.getTime() <= monday.getTime()) && (endDate.getTime() >= friday.getTime())) return '<div class="bar full"></div>';

    let result  = '';
    let dayDate = new Date(monday.getTime());
    
    for(let i = 1; i < 6; i++) {
        
        result += '<div class="bar day ';
        
        if(startDate.getTime() <= dayDate.getTime()) {
            if(endDate.getTime() >= dayDate.getTime()) {
                result += 'full ';
            } else {
                result += 'blank ';
            }
        } else {
            result += 'blank ';
        }
        
        result += '"></div>';
        dayDate.setDate(dayDate.getDate() + 1);
        
    }
    
    return result;
    
}


// Process Item Flat BOM
function processFlatBOM(data) {

    var bomView = data.bomViews[0].link.split('/');
    var viewId  = bomView[bomView.length - 1];

    utils.print('> Getting flat BOM data');

    f3m.getFlatBOM({
        'wsId' : options.workspaceId,
        'dmsId' : dmsId,
        'viewId' : viewId
    }).then(function(bom) {

        utils.print('> Found ' + bom.flatItems.length + ' BOM entries');

        let elemFlatBOM  = '<div class="heading">BOM List</div>';
            elemFlatBOM += '<table class="table">';
            elemFlatBOM += '<tr>';
            elemFlatBOM += '<th>Component</th>';
            elemFlatBOM += '<th class="qty">Quantity</th>'
            elemFlatBOM += '</tr>';
        
        for(flatItem of bom.flatItems) {
            elemFlatBOM += '<tr><td>' + flatItem.item.title + '</td><td class="qty">' + flatItem.totalQuantity + '</td></tr>';
        }
        
        elemFlatBOM += '</table>';
        apvRoot.querySelectorAll('.flatBom')[0].set_content(elemFlatBOM);
        postProcess();
        
    });
        
}


// Save file, upload to PLM and transition record if needed
function postProcess() {

    pdf.create(apvRoot.toString(), options.format).toFile(options.output + '/' + fileName, function(err, res) {

        if (err) return console.log(err);
                                
        utils.print('> File saved as ' + fileName);
        
        if(options.uploadReport) {
            utils.print('> Uploading file to PLM');
            f3m.uploadFile(utils.genItemLink(options.workspaceId, dmsId), options.output, fileName, options.uploadFolder).then(function() {
                utils.print('> Upload done');
                transitionRecord();
            });
        } else {
            transitionRecord();
        }
                                                    
    });

}
function transitionRecord() {

    if(options.transitionId !== '') {
        utils.print('> Transitioning record in PLM');
        f3m.performTransition({
            'wsId' : options.workspaceId,
            'dmsId' : dmsId,
            'transitionId' : options.transitionId
        }).then(function() {
            proceed();
        });
    } else {
        proceed();
    }

}
function proceed() {

    records.splice(0, 1);
    processRecords();

}