const Joi = require("joi");
const sendMail = require("../utils/mail");
const prisma = require("../utils/connection");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const { createToken } = require("../utils/jwt");

const register = async (req, res, next) => {
  try {
    const { fullname, email, password, address } = req.body;
    const schema = Joi.object({
      fullname: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      address: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const findUser = await prisma.users.findUnique({ where: { email } });
    if (findUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    await sendMail(email, otp);

    await prisma.otp.create({
      data: { fullname, email, password, address, otp },
    });
    console.log(otp);

    res.status(201).json({ message: "Verification code sent to your email" });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(4).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Permission Denied" });
    }

    const findUser = await prisma.users.findUnique({ where: { email } });
    if (!findUser) {
      return res.status(403).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid email or password" });
    }

    const token = createToken({
      id: findUser.id,
      isAdmin: findUser.isAdmin,
    });
    res.status(200).json({ message: "token", token });
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const { code, email } = req.body;

    const findOtp = await prisma.otp.findFirst({
      where: { email, createdAt: { gt: new Date(new Date() - 60000) } },
    });

    if (!findOtp || findOtp.otp !== code) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    const findUser = await prisma.users.findUnique({ where: { email } });
    if (findUser) {
      return res.status(403).json({ message: "Email already exists" });
    }

    const hashedPwd = await bcrypt.hash(findOtp.password, 10);

    const user = await prisma.users.create({
      data: {
        fullname: findOtp.fullname,
        email: findOtp.email,
        password: hashedPwd,
        address: findOtp.address,
      },
    });

    const token = createToken({ id: user.id, isAdmin: user.isAdmin });

    return res.json({ message: "success", token });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(4).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await prisma.users.findFirst({
      where: { email, isAdmin: true },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = createToken({ id: user.id, isAdmin: user.isAdmin });
    res.json({ message: "Admin logged in successfully", token });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  verify,
  adminLogin,
};
