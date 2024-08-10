const prisma = require("../utils/connection");

const search = async (req, res, next) => {
  try {
    const { query, type } = req.query;

    if (!query || !type) {
      return res.status(400).json({ message: "Query and type are required" });
    }

    let results = [];

    if (type === "restaurant") {
      results = await prisma.restaurants.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          address: true,
          categoryId: true,
          image: true,
          rating: true,
        },
      });
    } else if (type === "food") {
      results = await prisma.foods.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          image: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              image: true,
              rating: true,
            },
          },
        },
      });
    } else {
      return res.status(400).json({ message: "Invalid type provided" });
    }

    res.status(200).json({ message: "Search results", data:results });
  } catch (error) {
    console.error("Error during search:", error);
    next(error);
  }
};

module.exports = { search };
