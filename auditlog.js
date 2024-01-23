// Include the library
var auditLog = require('audit-log');

// Add a transport system
auditLog.addTransport("mongoose", {connectionString: "mongodb://localhost:27017/myDatabase"});
auditLog.addTransport("console");

// Log an event
auditLog.logEvent('user id or something', 'maybe script name or function', 'what just happened', 'the affected target name perhaps', 'target id', 'additional info, JSON, etc.');

// Log another kind of message of your devising
auditLog.log({logType:'Warning', text:'An error occurred and you should fix it.', datetime:'2013-01-31 13:15:02', traceData:'...'});
