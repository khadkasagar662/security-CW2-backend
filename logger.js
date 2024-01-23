const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream').createStream;

const logDirectory = path.join(__dirname, 'logs'); // Create a logs directory
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory); // Ensure it exists

const logStream = rfs('user_activity.log', {
  // Create a rotating write stream
  interval: '1d', // Rotate daily
  path: logDirectory,
  size: '10M', 
  compress: 'gzip',
  initialRotation: true,
});

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${message}\n`;

  logStream.write(logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    } else {
      console.log('Log entry written successfully:', logEntry);
    }
  });
}

module.exports = {
  log,
};

// log('Test log entry');
