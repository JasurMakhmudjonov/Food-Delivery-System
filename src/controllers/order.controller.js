const prisma = require("../utils/connection");
const Joi = require("joi");

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartItems = await prisma.carts.findMany({
      where: { userId },
      include: {
        food: true,
      },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalPrice = cartItems.reduce((total, item) => {
      return total + item.totalPrice;
    }, 0);

    const order = await prisma.orders.create({
      data: {
        userId,
        status: "PREPARING",
        totalPrice,
      },
    });

    const orderedItems = cartItems.map((item) => ({
      orderId: order.id,
      foodId: item.foodId,
      quantity: item.quantity,
      unitPrice: item.food.price,
    }));

    await prisma.orderedItems.createMany({
      data: orderedItems,
    });

    await prisma.carts.deleteMany({
      where: { userId },
    });

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing order:", error);
    next(error);
  }
};

const showOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const order = await prisma.orders.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        orderedItems: {
          include: {
            food: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
            address: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found for this user" });
    }

    res.status(200).json({ message: "Order retrieved successfully", order });
  } catch (error) {
    console.error("Error fetching order:", error);
    next(error);
  }
};

const showAllOrder = async (req, res, next) => {
  try {
    const allOrders = await prisma.orders.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        orderedItems: {
          include: {
            food: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
            address: true,
          },
        },
      },
    });
    res
      .status(200)
      .json({ message: "All orders retrieved successfully", allOrders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isAdmin = req.user.isAdmin;
    const userId = req.user.id;

    const schema = Joi.object({
      status: Joi.string()
        .valid("PREPARING", "SHIPPING", "DELIVERED", "CANCELED")
        .required(),
    });

    const { error } = schema.validate({ status });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const order = await prisma.orders.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== userId && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this order" });
    }

    if (order.status === "PREPARING") {
      if (!isAdmin && status !== "CANCELED") {
        return res.status(400).json({
          message: "User can only cancel the order while it is preparing",
        });
      }
      if (isAdmin && (status === "CANCELED" || status === "DELIVERED")) {
        return res.status(400).json({
          message:
            "Admin can only change status to Shipping while it is preparing",
        });
      }
    } else if (order.status === "SHIPPING") {
      if (!isAdmin) {
        return res.status(400).json({
          message: "User cannot cancel the order while it is shipping",
        });
      }
      if (isAdmin && status === "PREPARING") {
        return res
          .status(400)
          .json({ message: "Admin cannot revert the order back to preparing" });
      }
    } else if (order.status === "DELIVERED") {
      if (!isAdmin) {
        return res.status(400).json({
          message: "User cannot cancel the order once it is delivered",
        });
      }
      if (isAdmin && (status === "PREPARING" || status === "SHIPPING")) {
        return res.status(400).json({
          message: "Admin cannot change the status of a delivered order",
        });
      }
    }

    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: { status },
    });

    res
      .status(200)
      .json({ message: "Order status updated successfully", updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the order exists
    const order = await prisma.orders.findUnique({
      where: { id },
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the user is authorized to cancel the order
    if (order.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this order" });
    }

    // Check the current status of the order
    if (order.status !== "PREPARING") {
      return res
        .status(400)
        .json({ message: "Order cannot be canceled at this stage" });
    }

    // Update the order status to 'CANCELED'
    const canceledOrder = await prisma.orders.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    res
      .status(200)
      .json({ message: "Order canceled successfully", canceledOrder });
  } catch (error) {
    console.error("Error canceling order:", error);
    next(error);
  }
};

module.exports = {
  showOrder,
  showAllOrder,
  updateOrder,
  cancelOrder,
};
