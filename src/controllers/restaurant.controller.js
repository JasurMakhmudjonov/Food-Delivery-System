const prisma = require("../utils/connection");
const path = require("path");
const { v4: uuid } = require("uuid");
const Joi = require("joi");

const createRestaurant = async (req, res, next) => {
  try {
    const { name, address, categoryId } = req.body;

    const schema = Joi.object({
      name: Joi.string().required(),
      address: Joi.string().required(),
      categoryId: Joi.string().required(),
    });
    const { error } = schema.validate({
      name,
      address,
      categoryId,
    });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { image } = req.files;

    const existsCategory = await prisma.categoryRestaurants.findUnique({
      where: { id: categoryId },
    });

    if (!existsCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const existsRestaurant = await prisma.restaurants.findUnique({
      where: { name, address },
    });
    if (existsRestaurant) {
      return res.status(400).json({ message: "Restaurant already exists" });
    }

    let imageName = `${uuid()}${path.extname(image.name)}`;
    await image.mv(`${process.cwd()}/uploads/${imageName}`);

    const restaurant = await prisma.restaurants.create({
      data: {
        name,
        address,
        categoryId,
        image: imageName,
      },
    });

    res
      .status(201)
      .json({ message: "Restaurant created successfully", data: restaurant });
  } catch (error) {
    next(error);
  }
};
const showAllRestaurant = async (req, res, next) => {
  try {
    const {
      sortBy = "rating",
      order = "desc",
      category,
      page = 1,
      limit = 10,
    } = req.query;

    // Allowed fields to sort by
    const allowedSortFields = ["rating", "name", "createdAt", "updatedAt"];
    // Allowed order values
    const allowedOrderValues = ["asc", "desc"];

    // Validate the sort field and order
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "rating";
    const sortOrder = allowedOrderValues.includes(order.toLowerCase())
      ? order.toLowerCase()
      : "desc";

    // Calculate the offset for pagination
    const offset = (page - 1) * limit;

    let restaurantFilter = {};

    if (category) {
      restaurantFilter.categoryId = category;
    }

    const restaurants = await prisma.restaurants.findMany({
      where: restaurantFilter,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: parseInt(offset),
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        address: true,
        categoryId: true,
        image: true,
        rating: true,
        foods: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            restaurantId: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Count the total number of restaurants matching the filter (for pagination)
    const totalRestaurants = await prisma.restaurants.count({
      where: restaurantFilter,
    });

    res.status(200).json({
      message: "Restaurants fetched successfully",
      total: totalRestaurants,
      page: parseInt(page),
      limit: parseInt(limit),
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

const showRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const findRestaurant = await prisma.restaurants.findUnique({
      where: { id },
    });
    if (!findRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const restaurant = await prisma.restaurants.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        categoryId: true,
        image: true,
        rating: true,
        foods: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            restaurantId: true,
            categoryId: true,
          },
        },

        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json({ data: restaurant });
  } catch (error) {
    next(error);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, categoryId } = req.body;

    const schema = Joi.object({
      name: Joi.string(),
      address: Joi.string(),
      categoryId: Joi.string(),
    });
    const { error } = schema.validate({ name, address, categoryId });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    let imageName = null;
    if (req.files && req.files.image) {
      const { image } = req.files;
      imageName = `${uuid()}${path.extname(image.name)}`;
      await image.mv(`${process.cwd()}/uploads/${imageName}`);
    }

    const updateData = { name, address, categoryId };
    if (imageName) {
      updateData.image = imageName;
    }

    const updatedRestaurant = await prisma.restaurants.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        address: true,
        image: true,
        rating: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Restaurant updated successfully", data:updatedRestaurant });
  } catch (error) {
    next(error);
  }
};

const removeRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.restaurants.delete({
      where: { id },
    });
    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { restaurantId } = req.params;
    const userId = req.user.id;

    const schema = Joi.object({
      rating: Joi.number().valid(1, 2, 3, 4, 5).required(),
      comment: Joi.string().required(),
    });

    const { error } = schema.validate({ rating, comment });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existsRestaurant = await prisma.restaurants.findUnique({
      where: { id: restaurantId },
    });
    if (!existsRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const existsUser = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!existsUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasDeliveredOrder = await prisma.orders.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        orderedItems: {
          some: {
            food: {
              restaurantId,
            },
          },
        },
      },
    });

    if (!hasDeliveredOrder) {
      return res.status(400).json({
        message:
          "User cannot post review for this restaurant without having a delivered order",
      });
    }

    const existingReview = await prisma.reviews.findFirst({
      where: {
        userId,
        restaurantId,
      },
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "User has already reviewed this restaurant" });
    }

    const review = await prisma.reviews.create({
      data: {
        rating,
        comment,
        userId,
        restaurantId,
      },
    });

    const reviews = await prisma.reviews.findMany({
      where: { restaurantId },
      select: {
        rating: true,
      },
    });

    const totalRating =
      reviews.reduce((total, review) => total + review.rating, 0) + 5;
    const averageRating = totalRating / (reviews.length + 1);

    await prisma.restaurants.update({
      where: { id: restaurantId },
      data: { rating: parseFloat(averageRating.toFixed(1)) },
    });

    res.status(201).json({ message: "Review created successfully", data:review });
  } catch (error) {
    console.error("Error creating review:", error);
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const schema = Joi.object({
      rating: Joi.number().valid(1, 2, 3, 4, 5),
      comment: Joi.string(),
    });

    const { error } = schema.validate({ rating, comment });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this review" });
    }

    const existsRestaurant = await prisma.restaurants.findUnique({
      where: { id: review.restaurantId },
    });
    if (!existsRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const hasDeliveredOrder = await prisma.orders.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        orderedItems: {
          some: {
            food: {
              restaurantId: review.restaurantId,
            },
          },
        },
      },
    });

    if (!hasDeliveredOrder) {
      return res.status(400).json({
        message:
          "User cannot update review for this restaurant without having a delivered order",
      });
    }

    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        rating,
        comment,
      },
    });

    const reviews = await prisma.reviews.findMany({
      where: { restaurantId: review.restaurantId },
      select: {
        rating: true,
      },
    });

    const totalRating =
      reviews.reduce((total, review) => total + review.rating, 0) + 5;
    const averageRating = totalRating / (reviews.length + 1);

    await prisma.restaurants.update({
      where: { id: review.restaurantId },
      data: { rating: parseFloat(averageRating.toFixed(1)) },
    });

    res
      .status(200)
      .json({ message: "Review updated successfully", data:updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    next(error);
  }
};

const removeReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this review" });
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    });

    const reviews = await prisma.reviews.findMany({
      where: { restaurantId: review.restaurantId },
      select: {
        rating: true,
      },
    });

    const totalRating =
      reviews.reduce((total, review) => total + review.rating, 0) + 5;
    const averageRating =
      reviews.length > 0 ? totalRating / (reviews.length + 1) : 5;
    await prisma.restaurants.update({
      where: { id: review.restaurantId },
      data: { rating: parseFloat(averageRating.toFixed(1)) },
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    next(error);
  }
};

module.exports = {
  createRestaurant,
  showAllRestaurant,
  showRestaurantById,
  updateRestaurant,
  removeRestaurant,
  createReview,
  updateReview,
  removeReview,
};
