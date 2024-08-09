const prisma = require("../utils/connection");
const Joi = require("joi");

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const schema = Joi.object({
      name: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const existsCategory = await prisma.categoryFoods.findUnique({
      where: { name },
    });
    if (existsCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    const category = await prisma.categoryFoods.create({
      data: { name },
    });
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    next(error);
  }
};

const showCategory = async (req, res, next) => {
  try {
    const allCategories = await prisma.categoryFoods.findMany();
    res.status(200).json({ message: "All categories", allCategories });
  } catch (error) {
    next(error);
  }
};

const showCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const categoryFood = await prisma.categoryFoods.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        foods: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
          },
        },
      },
    });

    if (!categoryFood) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Food Category", categoryFood });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const schema = Joi.object({
      name: Joi.string(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const existsCategory = await prisma.categoryFoods.findUnique({
      where: { id },
    });
    if (!existsCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const category = await prisma.categoryFoods.update({
      where: { id },
      data: { name },
    });

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    next(error);
  }
};

const removeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existsCategory = await prisma.categoryFoods.findUnique({
      where: { id },
    });
    if (!existsCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    await prisma.categoryFoods.delete({ where: { id } });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  showCategory,
  showCategoryById,
  updateCategory,
  removeCategory,
};
