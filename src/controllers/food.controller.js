const prisma = require("../utils/connection");
const path = require("path");
const { v4: uuid } = require("uuid");
const Joi = require("joi");

const createFood = async (req, res, next) => {
  try {
    const { name, description, price, restaurantId, categoryId } = req.body;

    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      restaurantId: Joi.string().required(),
      categoryId: Joi.string().required(),
    });
    const { error } = schema.validate({
      name,
      description,
      price,
      restaurantId,
      categoryId,
    });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { image } = req.files;

    const existsCategory = await prisma.categoryFoods.findUnique({
      where: { id: categoryId },
    });

    if (!existsCategory) {
      console.log("Category not found:", existsCategory);
      return res.status(404).json({ message: "Category not found" });
    }

    const existsRestaurant = await prisma.restaurants.findUnique({
      where: { id: restaurantId },
    });
    if (!existsRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let imageName = `${uuid()}${path.extname(image.name)}`;
    await image.mv(`${process.cwd()}/uploads/${imageName}`);

    const existsFood = await prisma.foods.findUnique({
      where: {
        name_restaurant_id: {
          name,
          restaurantId,
        },
      },
    });
    if (existsFood) {
      return res.status(400).json({ message: "Food already exists" });
    }

    const food = await prisma.foods.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image: imageName,
        restaurantId,
        categoryId,
      },
    });

    res.status(201).json({ message: "Food created successfully", data:food });
  } catch (error) {
    console.error("Error creating food:", error);
    next(error);
  }
};

const showAllFood = async (req, res, next) => {
  try {
    const allFood = await prisma.foods.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            rating: true,
          },
        },
      },
    });
    res.status(200).json({ message: "All foods", data:allFood });
  } catch (error) {
    next(error);
  }
};

const showFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existsFood = await prisma.foods.findUnique({ where: { id } });
    if (!existsFood) {
      return res.status(404).json({ message: "Food not found" });
    }

    const food = await prisma.foods.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            rating: true,
          },
        },
      },
    });

    res.status(200).json({ message: "Food", data:food });
  } catch (error) {
    console.log("error", error);

    next(error);
  }
};

const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, restaurantId, categoryId } = req.body;
    const schema = Joi.object({
      name: Joi.string(),
      description: Joi.string(),
      price: Joi.number(),
      restaurantId: Joi.string(),
      categoryId: Joi.string(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    let imageName = null;
    if (req.files && req.files.image) {
      const { image } = req.files;
      imageName = `${uuid()}${path.extname(image.name)}`;
      await image.mv(`${process.cwd()}/uploads/${imageName}`);
    }

    const updateData = { name, description, price, restaurantId, categoryId };
    if (imageName) {
      updateData.image = imageName;
    }
    if (categoryId) {
      const existsCategory = await prisma.categoryFoods.findUnique({
        where: { id: categoryId },
      });
      if (!existsCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    if (restaurantId) {
      const existsRestaurant = await prisma.restaurants.findUnique({
        where: { id: restaurantId },
      });
      if (!existsRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
    }

    const food = await prisma.foods.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            rating: true,
          },
        },
      },
    });
    res.status(200).json({ message: "Food updated successfully", data:food });
  } catch (error) {
    next(error);
  }
};

const removeFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existsFood = await prisma.foods.findUnique({ where: { id } });
    if (!existsFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    await prisma.foods.delete({ where: { id } });
    res.status(200).json({ message: "Food deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    const userId = req.user.id;
    const { quantity } = req.body;

    const schema = Joi.object({
      quantity: Joi.number().integer().min(1).required(),
    });
    const { error } = schema.validate({ quantity });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const food = await prisma.foods.findUnique({
      where: { id: foodId },
    });
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    const findCartItem = await prisma.carts.findFirst({
      where: { userId, foodId },
    });
    if (findCartItem) {
      return res.status(400).json({ message: "Food already in cart" });
    }

    const totalPrice = food.price * quantity;

    const cartItem = await prisma.carts.create({
      data: {
        userId,
        foodId,
        quantity,
        totalPrice,
      },
    });

    res.status(201).json({ message: "Food added to cart", data:cartItem });
  } catch (error) {
    console.error("Error adding to cart:", error);
    next(error);
  }
};

module.exports = {
  createFood,
  showAllFood,
  showFoodById,
  updateFood,
  removeFood,
  addToCart,
};
