const prisma = require("../utils/connection");
const bcrypt = require("bcrypt");
const path = require("path");
const { v4: uuid } = require("uuid");
const Joi = require("joi");

const showAll = async (req, res, next) => {
  try {
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          select: {
            id: true,
            comment: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.status(200).json({ data:allUsers });
  } catch (error) {
    next(error);
  }
};

const showById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id != req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        fullname: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          select: {
            id: true,
            comment: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                image: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ data:user });
  } catch (error) {
    next(error);
  }
};

const updateByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id != req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { fullname, password, address } = req.body;

    const schema = Joi.object({
      fullname: Joi.string(),
      password: Joi.string().min(4),
      address: Joi.string(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    let imageName = undefined;
    if (req.files && req.files.profileImage) {
      imageName = `${uuid()}${path.extname(req.files.profileImage.name)}`;
      req.files.profileImage.mv(`${process.cwd()}/uploads/${imageName}`);
    }
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const user = await prisma.users.update({
      where: { id: req.user.id },
      data: {
        fullname,
        password: hashedPassword,
        address,
        profileImage: imageName,
      },
    });
    res.status(200).json({ message: "User updated successfully", data:user });
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
};
const updateByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullname, password, address, email } = req.body;

    const schema = Joi.object({
      fullname: Joi.string(),
      email: Joi.string(),
      password: Joi.string().min(4),
      address: Joi.string(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const findUser = await prisma.users.findUnique({where: {
      id
    }})
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const user = await prisma.users.update({
      where: { id },
      data: {
        fullname,
        email,
        password: hashedPassword,
        address,
      },
    });
    res.status(200).json({ message: "User updated successfully", data:user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.users.delete({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  showAll,
  showById,
  updateByUser,
  updateByAdmin,
  deleteUser,
};
