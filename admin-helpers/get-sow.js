// RETRIEVE THE MY OUTSTANDING WORK LIST OF SOMEONE ELSE
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options/store-dmsid.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-04-29: Initial Version
   -------------------------------------------------------------------------------------------------------- */

const options   = require('./options/get-sow.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');
const fs        = require('fs');


utils.printStart([
    [ 'User' , options.user],
    [ 'File' , options.file]
]);


f3m.login().then(function() {
    utils.print('Enforcing MOW update');
    f3m.getMyOutStandingWork(options.user).then(function() {
        utils.print('Requesting updated MOW');
        f3m.getMyOutStandingWork(options.user).then(function(result) {
            genReport(result);
        });
    });
});


function genReport(result) {

    let pathFile = '../out/' + options.file;
    let stream   = fs.createWriteStream(pathFile);
    
    stream.once('open', function(fd) {
        //var html = buildHtml();

        let html = '<!DOCTYPE html>';
            html += '<html>';
            html += '<head>';
            html += '<title>MOW of ' + options.user + '</title>';
            html += '<style>';
            html += 'body { font-family: Arial; margin : 0px; padding : 25px; }';
            html += 'th { text-align: left; color : white; background : black; padding : 5px; }';
            html += 'td { border-bottom : 1px solid #eee; padding : 5px;}';
            html += '</style>';
            html += '</head>';
            html += '<body>';
            html += '<p>Total Records : ' + result.count + '</p>';
            html += '<p>Last Update   : ' + utils.getDateTimeString(new Date(result.lastRecalculateUpdate)) + '</p>';
            html += '<table>';
            html += '<tr><th>Due Date</th><th>Flag</th><th>Item</th><th>Workspace</th><th>Status</th></tr>';

            for(item of result.outstandingWork) {

                let date = (typeof item.milestoneDate === 'undefined') ? '' : utils.getDateTimeString(new Date(item.milestoneDate));

                html += '<tr>';
                html += '<td>' + date + '</td>';
                html += '<td>' + item.workflowStateName + '</td>';
                html += '<td><a target="_blank" href="' + utils.genItemHREF(item.item.link) + ' ">' + item.item.title + '</a></td>';
                html += '<td>' + item.workspace.title + '</td>';
                html += '<td>' + item.workflowStateName + '</td>';
                html += '</tr>';

            }

            html += '<table>';
            html += '</body>';
            html += '</html>';

        stream.end(html);

        utils.print('Found ' + result.count + ' entries');
        utils.print('Output saved to ../out/' + options.file);
        utils.printEnd();

    });

}