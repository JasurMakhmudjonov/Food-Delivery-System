const errorHandler = async (err, req, res, next) => {
  console.log(err);
  
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = errorHandler;
