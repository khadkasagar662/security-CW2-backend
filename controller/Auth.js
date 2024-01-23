const { User } = require('../model/User');
const crypto = require('crypto');
const { sanitizeUser, sendMail } = require('../services/common');
const jwt = require('jsonwebtoken');
const { log } = require('../logger'); // Import your logger

exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      'sha256',
      async function (err, hashedPassword) {
        const user = new User({ ...req.body, password: hashedPassword, salt });
        const doc = await user.save();

        // Log user creation activity
        const logMessage = `User created: ${doc.username} (${doc.email})`;
        log(logMessage);

        req.login(sanitizeUser(doc), (err) => {
          if (err) {
            // Log error if login fails
            const logErrorMessage = `Error during login: ${err.message}`;
            log(logErrorMessage);

            res.status(400).json(err);
          } else {
            // Log successful login
            const logMessage = `User logged in: ${doc.username} (${doc.email})`;
            log(logMessage);

            const token = jwt.sign(sanitizeUser(doc), process.env.JWT_SECRET_KEY);
            res
              .cookie('jwt', token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
              })
              .status(201)
              .json({ id: doc.id, role: doc.role });
          }
        });
      }
    );
  } catch (err) {
    // Log error if user creation fails
    const logErrorMessage = `Error creating user: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    // Check if the user exists
    if (!user) {
      // Log login attempt failure
      const logMessage = `Login attempt failed for non-existing user: ${email}`;
      log(logMessage);

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if the account is locked
    if (user.accountLocked) {
      // Log login attempt failure due to locked account
      const logMessage = `Login attempt failed for locked account: ${email}`;
      log(logMessage);

      return res.status(401).json({ message: 'Account locked. Too many login attempts.' });
    }

    // Validate the password
    crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', async function (err, hashedPassword) {
      if (err) {
        // Log login attempt failure
        const logErrorMessage = `Error validating password for user: ${email}`;
        log(logErrorMessage);

        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.password.equals(hashedPassword)) {
        // Password is correct, reset login attempts
        user.loginAttempts = 0;
        user.accountLocked = false;
        await user.save();

        // Log successful login
        const logMessage = `User logged in: ${user.username} (${user.email})`;
        log(logMessage);

        const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);
        res.cookie('jwt', token, {
          expires: new Date(Date.now() + 3600000),
          httpOnly: true,
        }).status(201).json({ id: user.id, role: user.role });
      } else {
        // Incorrect password, increment login attempts
        user.loginAttempts += 1;

        // Check if login attempts exceed a threshold, lock the account
        if (user.loginAttempts >= 3) {
          user.accountLocked = true;
        }

        await user.save();

        // Log login attempt failure
        const logMessage = `Login attempt failed for user: ${user.email}`;
        log(logMessage);

        res.status(401).json({ message: 'Invalid email or password' });
      }
    });
  } catch (err) {
    // Log login attempt failure
    const logErrorMessage = `Error during login attempt: ${err.message}`;
    log(logErrorMessage);

    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  // Log user logout activity
  const logMessage = 'User logged out';
  log(logMessage);

  res
    .cookie('jwt', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .sendStatus(200);
};

exports.checkAuth = async (req, res) => {
  if (req.user) {
    // Log user authentication check success
    const logMessage = `Authentication check successful: ${req.user.username} (${req.user.email})`;
    log(logMessage);

    res.json(req.user);
  } else {
    // Log authentication check failure
    const logMessage = 'Authentication check failed';
    log(logMessage);

    res.sendStatus(401);
  }
};

exports.resetPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(48).toString('hex');
    user.resetPasswordToken = token;
    await user.save();

    // Log password reset request activity
    const logMessage = `Password reset requested for: ${email}`;
    log(logMessage);

    // Existing code for sending email and response
    const resetPageLink =
      'http://localhost:3000/reset-password?token=' + token + '&email=' + email;
    const subject = 'reset password for e-commerce';
    const html = `<p>Click <a href='${resetPageLink}'>here</a> to Reset Password</p>`;

    if (email) {
      const response = await sendMail({ to: email, subject, html });
      res.json(response);
    } else {
      res.sendStatus(400);
    }
  } else {
    // Log error if user not found for password reset request
    const logErrorMessage = `User not found for password reset request: ${email}`;
    log(logErrorMessage);

    res.sendStatus(400);
  }
};

exports.resetPassword = async (req, res) => {
  const { email, password, token } = req.body;

  const user = await User.findOne({ email: email, resetPasswordToken: token });
  if (user) {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      'sha256',
      async function (err, hashedPassword) {
        user.password = hashedPassword;
        user.salt = salt;
        await user.save();

        // Log password reset activity
        const logMessage = `Password reset for: ${email}`;
        log(logMessage);

        // Existing code for sending email and response
        const subject = 'password successfully reset for e-commerce';
        const html = `<p>Successfully able to Reset Password</p>`;

        if (email) {
          const response = await sendMail({ to: email, subject, html });
          res.json(response);
        } else {
          res.sendStatus(400);
        }
      }
    );
  } else {
    // Log error if user not found for password reset
    const logErrorMessage = `User not found for password reset: ${email}`;
    log(logErrorMessage);

    res.sendStatus(400);
  }
};
