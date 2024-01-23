const { Order } = require("../model/Order");
const { Product } = require("../model/Product");
const { User } = require("../model/User");
const { sendMail, invoiceTemplate } = require("../services/common");
const { log } = require('../logger'); 

exports.fetchOrdersByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const orders = await Order.find({ user: id });

    // Log fetchOrdersByUser activity
    const logMessage = `User with ID ${id} fetched their orders`;
    log(logMessage);

    res.status(200).json(orders);
  } catch (err) {
    // Log error in fetchOrdersByUser
    const logErrorMessage = `Error fetching orders for user with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.createOrder = async (req, res) => {
  const order = new Order(req.body);
  
  // Log createOrder activity
  const logMessage = `Order created for user with ID ${order.user}`;
  log(logMessage);

  // Update stocks
  for (let item of order.items) {
    try {
      let product = await Product.findOne({ _id: item.product.id });
      product.stock -= item.quantity;
      await product.save();
    } catch (err) {
      // Log error in updating stocks
      const logErrorMessage = `Error updating stock for product ${item.product.id} during order creation: ${err.message}`;
      log(logErrorMessage);
      res.status(400).json(err);
      return;
    }
  }

  try {
    const doc = await order.save();
    const user = await User.findById(order.user);
    await sendMail({ to: user.email, html: invoiceTemplate(order), subject: 'Order Received' });

    // Log successful order creation
    const successLogMessage = `Order created successfully for user with ID ${order.user}`;
    log(successLogMessage);

    res.status(201).json(doc);
  } catch (err) {
    // Log error in createOrder
    const logErrorMessage = `Error creating order for user with ID ${order.user}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndDelete(id);

    // Log deleteOrder activity
    const logMessage = `Order deleted with ID ${id}`;
    log(logMessage);

    res.status(200).json(order);
  } catch (err) {
    // Log error in deleteOrder
    const logErrorMessage = `Error deleting order with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    // Log updateOrder activity
    const logMessage = `Order updated with ID ${id}`;
    log(logMessage);

    res.status(200).json(order);
  } catch (err) {
    // Log error in updateOrder
    const logErrorMessage = `Error updating order with ID ${id}: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};

exports.fetchAllOrders = async (req, res) => {
  // sort = {_sort:"price",_order="desc"}
  // pagination = {_page:1,_limit=10}
  let query = Order.find({ deleted: { $ne: true } });
  let totalOrdersQuery = Order.find({ deleted: { $ne: true } });

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalOrdersQuery.count().exec();
  console.log({ totalDocs });

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set('X-Total-Count', totalDocs);

    // Log fetchAllOrders activity
    const logMessage = 'All orders fetched successfully';
    log(logMessage);

    res.status(200).json(docs);
  } catch (err) {
    // Log error in fetchAllOrders
    const logErrorMessage = `Error fetching all orders: ${err.message}`;
    log(logErrorMessage);

    res.status(400).json(err);
  }
};
