const config = require("./config");
module.exports = () => {
  return (req, res, next) => {
    const token = req.body.key || req.query.key || req.headers.key;
    if (token) {
      if (token == config.SECRET_KEY) {
        next();
      } else {
        return res
          .status(401)
          .send({ success: false, error: "Unauthorized access" });
      }
    } else {
      return res
        .status(401)
        .send({ success: false, error: "Unauthorized access" });
    }
  };
};
