const { Cart } = require('../model/Cart');
const { log } = require('../logger'); 

exports.fetchCartByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const cartItems = await Cart.find({ user: id }).populate('product');

    // Log fetchCartByUser activity
    const logMessage = `User with ID ${id} fetched their cart items`;
    log(logMessage);

    res.status(200).json(cartItems);
  } catch (err) {
    // Log error in fetchCartByUser
    const logErrorMessage = `Error fetching cart items for user with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.addToCart = async (req, res) => {
  const { id } = req.user;
  const cart = new Cart({ ...req.body, user: id });
  try {
    const doc = await cart.save();
    const result = await doc.populate('product');

    // Log addToCart activity
    const logMessage = `Product added to cart by user with ID ${id}`;
    log(logMessage);

    res.status(201).json(result);
  } catch (err) {
    // Log error in addToCart
    const logErrorMessage = `Error adding product to cart for user with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.deleteFromCart = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Cart.findByIdAndDelete(id);

    // Log deleteFromCart activity
    const logMessage = `Product deleted from cart with ID ${id}`;
    log(logMessage);

    res.status(200).json(doc);
  } catch (err) {
    // Log error in deleteFromCart
    const logErrorMessage = `Error deleting product from cart with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.updateCart = async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await Cart.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    const result = await cart.populate('product');

    // Log updateCart activity
    const logMessage = `Cart item updated with ID ${id}`;
    log(logMessage);

    res.status(200).json(result);
  } catch (err) {
    // Log error in updateCart
    const logErrorMessage = `Error updating cart item with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};
