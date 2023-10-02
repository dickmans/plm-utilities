exports.template     = 'problem-report.html';
exports.output       = 'pdf';
exports.uploadReport = true;
exports.uploadFolder = 'Reports';
exports.workspaceId  = '82';
exports.dmsId        = '';
exports.status       = 'Create';
exports.transitionId = '';
exports.fieldId      = 'TITLE';
exports.fieldValue   = '';


exports.format      = { 
    'border' : {
        'top'       : '0.5cm',   // default is 0, units: mm, cm, in, px
        'right'     : '0.8cm',
        'bottom'    : '0.5cm',
        'left'      : '0.8cm'
    },
    'format' : 'A4', 
    'orientation': 'portrait',
    'header' : { 
        'height' : '20mm' 
    },
    'footer' : {
        'height' : '8mm'
    }
};