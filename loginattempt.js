const loginAttemptLimit = (req, res, next) => {
  const maxLoginAttempts = 3;
  const lockoutDuration = 600000; 
  const userKey = req.body.email;

  if (!req.session.loginAttempts) {
    req.session.loginAttempts = {};
  }

  if (!req.session.loginAttempts[userKey]) {
    req.session.loginAttempts[userKey] = {
      attempts: 0,
      locked: false,
    };
  }

  const userAttempts = req.session.loginAttempts[userKey];

  if (userAttempts.locked) {
    const lockoutTimeRemaining = lockoutDuration - (Date.now() - userAttempts.lockedTimestamp);
    return res.status(401).json({
      message: `Account locked out. Too many login attempts. Please try again after ${lockoutTimeRemaining / 1000} seconds.`,
    });
  }

  if (userAttempts.attempts >= maxLoginAttempts) {
    userAttempts.locked = true;
    userAttempts.lockedTimestamp = Date.now();
    return res.status(401).json({ message: 'Account locked out. Too many login attempts.' });
  }

  next();
};

module.exports = loginAttemptLimit;
