const prisma = require("../utils/connection");
const Joi = require("joi");

// const createCart = async (req, res, next) => {
//   try {
//     const { foodId, quantity } = req.body;
//     const userId = req.user.id;

//     const schema = Joi.object({
//       foodId: Joi.string().uuid().required(),
//       quantity: Joi.number().integer().min(1).required(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.message });
//     }

//     const existingCartItem = await prisma.carts.findFirst({
//       where: {
//         userId: userId,
//         foodId: foodId,
//       },
//     });
//     if (existingCartItem) {
//       return res
//         .status(400)
//         .json({ message: "Cart already exists for this user and food" });
//     }

//     const food = await prisma.foods.findUnique({ where: { id: foodId } });
//     if (!food) {
//       return res.status(404).json({ message: "Food not found" });
//     }

//     const totalPrice = food.price * quantity;

//     const cart = await prisma.carts.create({
//       data: {
//         userId,
//         foodId,
//         quantity,
//         totalPrice,
//       },
//     });

//     res.status(201).json({ message: "Cart created successfully", cart });
//   } catch (error) {
//     next(error);
//   }
// };

const showCarts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const carts = await prisma.carts.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        userId: true,
        foodId: true,
        quantity: true,
        totalPrice: true,
        food: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
    });

    let totalPrice = 0;
    carts.forEach((cart) => {
      totalPrice += cart.totalPrice;
    });

    res
      .status(200)
      .json({ message: "Carts retrieved successfully", carts, totalPrice });
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const schema = Joi.object({
      quantity: Joi.number().integer().min(1),
    });
    const { error } = schema.validate({ quantity });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existingCartItem = await prisma.carts.findFirst({
      where: { id, userId },
    });
    if (!existingCartItem) {
      return res
        .status(404)
        .json({ message: "Cart item not found for this user" });
    }

    const foodItem = await prisma.foods.findUnique({
      where: { id: existingCartItem.foodId },
    });
    if (!foodItem) {
      return res.status(404).json({ message: "Food not found" });
    }

    const newTotalPrice = foodItem.price * quantity;

    const updatedCartItem = await prisma.carts.update({
      where: { id },
      data: { quantity, totalPrice: newTotalPrice },
    });

    res
      .status(200)
      .json({ message: "Cart updated successfully", updatedCartItem });
  } catch (error) {
    console.error("Error updating cart:", error);
    next(error);
  }
};

const removeCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const cartItem = await prisma.carts.findFirst({
      where: { id, userId },
    });
    if (!cartItem) {
      return res
        .status(404)
        .json({ message: "Cart item not found for this user" });
    }
    
    await prisma.carts.delete({ where: { id } });
    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  showCarts,
  updateCart,
  removeCart,
  createOrder,
};
