// GET ENTRIES OF SYSTEM LOG TO DETERMINE USER LOGINS
// Please provide clientId and clientSecret of your Forge app in file settings.js 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-07-18: Improved reliability
    - 2023-01-27: Replacement of axios calls with f3m library
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-04-15: Initial version
   -------------------------------------------------------------------------------------------------------- */


const settings  = require('../settings.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');
const fs        = require('fs');


let limit           = 25;
let offset          = 0;
let totalCount      = 100;
let logins          = [];
let records         = [];
let users           = [];
let loginCounts     = [0, 0, 0, 0];
let startWeek       = new Date();
let startMonth      = new Date();
let endPrevMonth    = new Date();
let startDate       = new Date();
let lastDate        = new Date();
let fileName        = '';
let folder          = 'reports';
let printAllLogins  = true;
let requestCount    = 3;
let failedRequests  = 0;
let maxFailures     = 100;
    
setDates();
setFile();
    
utils.printStart([
    [ 'Output file name', fileName],
    [ 'Print all logins', printAllLogins],
    [ 'Request Size', limit],
    [ 'Output Folder', folder],
]);


f3m.login().then(function() {
    getSystemLogs();
});



// Get log entries
function getSystemLogs() {
    
    let requests = [];
    let next    = 0;

    for(let i = 0; i < requestCount; i++) {
        next = offset + (i * limit);
        if(next < totalCount) {
            requests.push(f3m.getSystemLog( { 'offset' : next, 'limit' : limit } ));
        }
    }

    Promise.all(requests).then(function (responses) {

        for(let response of responses) {
            
                 if(typeof response        === 'undefined') { failedRequests++; printLine('Response is undefined, proceeding with next');         }
            else if(typeof response.data   === 'undefined') { failedRequests++; printLine('Response data is undefined, proceeding with next');    }
            else if(typeof response.data.length   ===    0) { failedRequests++; printLine('Response data is of length 0');    }
            else if(typeof response.status === 'undefined') { failedRequests++; printLine('Response status is undefined, proceeding with next');  }
            else if(       response.status !== 200)         { failedRequests++; printLine('Response status is unexpected (' + response.status + '), proceeding with next'); }
            else {

                failedRequests = 0;
        
                if(response.data.totalCount > totalCount) {
                    printLine('    There are ' + response.data.totalCount + ' log entries in total');
                    printLine('');
                    totalCount = response.data.totalCount;
                }
            
                let events = response.data.items;
            
                printLine('    Getting log entries ' + (offset + 1) + ' to ' + (offset + limit) + ' (ending ' + events[events.length - 1].timestamp + ')');
            
                for(let logEvent of events) {
                    
                    if(logEvent.action === 'Log In') {
                        
                        lastDate        = new Date(logEvent.timestamp);
                        let record      = logEvent.timestamp.substr(0, 10) + '|' + logEvent.user.urn;
                        let userRecord  = null;
                        
                        if(lastDate.getTime() > startDate.getTime()) {
                            
                            for(let user of users) {
                                if(user.title === logEvent.user.title) {
                                    userRecord = user;
                                }
                            }
                            
                            if(userRecord === null) {
                                userRecord = {
                                    title   : logEvent.user.title,
                                    week    : 0,
                                    month   : 0,
                                    last    : 0,
                                    prev    : 0 
                                }
                                users.push(userRecord);
                            }
                            
                            logins.push(logEvent.timestamp + '  |  ' + logEvent.user.title);
                        
                            if(records.indexOf(record) === -1) {

                                     if(lastDate.getTime() >=    startWeek.getTime()) { loginCounts[0]++; userRecord.week++;  }
                                     if(lastDate.getTime() >=   startMonth.getTime()) { loginCounts[1]++; userRecord.month++; }
                                else if(lastDate.getTime() >= endPrevMonth.getTime()) { loginCounts[2]++; userRecord.last++;  }
                                else                                                  { loginCounts[3]++; userRecord.prev++;  }
                            
                            }
                                                
                            records.push(record);
                            
                        }
                    }
                } 
                
            }

            offset = offset + limit;

        }

        if(failedRequests >= maxFailures) {
            console.log();
            console.log();
            console.log('  !!! ABORTED after ' + failedRequests + ' failing requests !!!');
            console.log();
            console.log();
        } else if((lastDate.getTime() > startDate.getTime()) && (offset < totalCount)) {
            getSystemLogs();
        } else {
            printResults();
        }

    });

}


// Init
function setDates() {

    startWeek.setDate(startWeek.getDate() - startWeek.getDay());
    startMonth.setDate(1);
    endPrevMonth.setDate(1);
    startDate.setDate(1);
    endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);
    startDate.setMonth(startDate.getMonth() - 2);
    
}
function setFile() {
    
    let now     = new Date();
    let month   = doubleDigit(now.getMonth() + 1);
    let day     = doubleDigit(now.getDate());
    let hours   = doubleDigit(now.getHours());
    let minutes = doubleDigit(now.getMinutes());
    let seconds = doubleDigit(now.getSeconds());

    
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }
    
    fileName  = 'Logins to ' + settings.tenant.toUpperCase() + ' as of ';
    fileName += now.getFullYear();
    fileName += '-';
    fileName += month;
    fileName += '-';
    fileName += day;
    fileName += ' ';
    fileName += hours;
    fileName += '-';
    fileName += minutes;
    fileName += '-';
    fileName += seconds;
    fileName += '.txt';
    
    fs.stat(folder + '/' + fileName, function(err, stat) {
        if(err == null) fs.unlinkSync(folder + '/' + fileName);
    });
    
}
function doubleDigit(value) {
        
    let result = value.toString();
    
    if(value < 10) result = '0' + result;
    
    return result;
    
}


// At very end, print out summary
function printResults() {
    
    printLogins();
    printCounts();
    printUsers();
    
    printLine('   ');
    printLine('   ');
    printLine('   *************************************** END ***************************************');
    printLine('   ');    
    
}
function printLogins() {
    
    if(!settings.printAllLogins) return;
    
    printLine('    ') ;
    printLine('    All Logins') ;
    printLine('   -----------------------------------------------------------------------------------'); ;
    for(login of logins) {
        printLine('    ' + login);
    }
    
}
function printCounts() {
    
    printLine('    ');
    printLine('    Unique logins per day');
    printLine('   -----------------------------------------------------------------------------------'); ;
    printLine('    This Week                : ' + loginCounts[0]); 
    printLine('    This Month               : ' + loginCounts[1]); 
    printLine('    Last Month               : ' + loginCounts[2]); 
    printLine('    Month before last month  : ' + loginCounts[3]); 
    printLine('   '); 
    
}
function printUsers() {
    
    users.sort(function(a, b){
        var nameA=a.title.toLowerCase(), nameB=b.title.toLowerCase()
    if (nameA < nameB) //sort string ascending
        return -1 
    if (nameA > nameB)
        return 1
    return 0 //default return value (no sorting)
    });
    
    printLine('    ');   
    printLine('    Logins by user                          This |    This |    Last | Month before');
    printLine('    User Name                               Week |   Month |   Month |   last month');
    printLine('   -----------------------------------------------------------------------------------'); ;
    
    for(user of users) {
        
        let name    = user.title;
        let week    = prefix(user.week,   8);
        let month   = prefix(user.month,  8);
        let last    = prefix(user.last,   8);
        let prev    = prefix(user.prev,  13);
        
        for(i = user.title.length; i < 36; i++) name += ' ';
        
        printLine('    ' + name + week + '|' + month + '|' + last + '|' + prev);
        
    }
    
}
function prefix(value, count) {
    
    let result = value.toString();
    let i = result.length;
    
    for(i = result.length; i < count; i++) result = ' ' + result;
    
    return result + ' ';
    
}
function printLine(data) {
   
    console.log(data);
    fs.appendFileSync(folder + '/' + fileName, data + '\r\n');
    
}