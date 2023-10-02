// OPTIONS BEING USED BY copy.js

exports.distributeTo = 'Project Managers,Product Management';    // Users Groups who will receive the  views 
exports.viewsToCopy  = [
    { wsId : 86, views : 'All Projects,Planned Projects', default : 'All Projects', force: false },
    { wsId : 95, views : 'All Products,Proposals', default : 'All Products', force: true }
];