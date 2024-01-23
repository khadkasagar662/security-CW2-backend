const { Category } = require('../model/Category');
const { User } = require('../model/User');
const { log } = require('../logger'); // Import your logger

exports.fetchUserById = async (req, res) => {
  const { id } = req.user;
  console.log(id); // Log user ID to the console (optional)
  try {
    const user = await User.findById(id);

    // Log user fetch activity
    const logMessage = `User with ID ${id} fetched`;
    log(logMessage);

    res.status(200).json({
      id: user.id,
      addresses: user.addresses,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    // Log error if fetch operation fails
    const logErrorMessage = `Error fetching user with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });

    // Log user update activity
    const logMessage = `User with ID ${id} updated`;
    log(logMessage);

    res.status(200).json(user);
  } catch (err) {
    // Log error if update operation fails
    const logErrorMessage = `Error updating user with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};
