const CoinPlan = require("./coinPlan.model");

// import model
const User = require("../user/user.model");
const History = require("../history/history.model");
// const History = require("../history/history.model");
const Setting = require("../setting/setting.model");

//import config
const config = require("../../config");

//create Coin Plan
exports.store = async (req, res) => {
  try {
    if (
      !req.body.dollar ||
      !req.body.productKey ||
      req.body.platFormType < 0 ||
      !req.body.coin
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid Details!!" });
    }

    const coinPlan = new CoinPlan();

    coinPlan.coin = req.body.coin;
    coinPlan.extraCoin = req.body.extraCoin;
    coinPlan.dollar = req.body.dollar;
    coinPlan.productKey = req.body.productKey;
    coinPlan.tag = req.body.tag;
    coinPlan.platFormType = parseInt(req.body.platFormType);

    await coinPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      coinPlan,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get active Coin Plan
exports.appPlan = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isActive: true });

    return res.status(200).json({
      status: true,
      message: "Success!!",
      coinPlan,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get all Coin Plan
exports.index = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Success!!!",
      coinPlan,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//update Coin Plan
exports.update = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res
        .status(200)
        .json({ status: false, message: "coin planId is required!!" });
    }

    const coinPlan = await CoinPlan.findById(req.query.planId);

    if (!coinPlan) {
      return res
        .status(200)
        .json({ status: false, message: "plan does not exist!!" });
    }

    coinPlan.coin = req.body.coin ? req.body.coin : coinPlan.coin;
    coinPlan.tag = req.body.tag ? req.body.tag : coinPlan.tag;
    coinPlan.extraCoin = req.body.extraCoin
      ? req.body.extraCoin
      : coinPlan.extraCoin;
    coinPlan.dollar = req.body.dollar ? req.body.dollar : coinPlan.dollar;
    coinPlan.productKey = req.body.productKey
      ? req.body.productKey
      : coinPlan.productKey;
    coinPlan.planLevel = req.body.planLevel
      ? req.body.planLevel
      : coinPlan.planLevel;
    coinPlan.platFormType = parseInt(req.body.platFormType)
      ? parseInt(req.body.platFormType)
      : parseInt(coinPlan.platFormType);

    // coinPlan.platFormType = parseInt(req.body.platFormType);

    await coinPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      coinPlan,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

//delete Coin Plan
exports.destroy = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res
        .status(200)
        .json({ status: false, message: "coin planId is required!!" });
    }

    const coinPlan = await CoinPlan.findById(req.query.planId);

    if (!coinPlan) {
      return res
        .status(200)
        .json({ status: false, message: "Plan does not exists!!" });
    }

    await coinPlan.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: "data deleted successfully!!" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};

//activate Inactivate Switch
exports.activeInactive = async (req, res) => {
  try {
    if (!req.query.planId) {
      return res
        .status(200)
        .json({ status: false, message: "coin planId is required!!" });
    }

    const coinPlan = await CoinPlan.findById(req.query.planId);

    if (!coinPlan) {
      return res
        .status(200)
        .json({ status: false, message: "Plan does not exists!!" });
    }

    coinPlan.isActive = !coinPlan.isActive;

    await coinPlan.save();

    return res.status(200).json({
      status: true,
      message: "Success!!",
      coinPlan,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//create coinHistory for android
exports.createHistory = async (req, res) => {
  try {
    if (req.body.userId && req.body.coinPlanId && req.body.paymentGateway) {
      const user = await User.findById(req.body.userId);

      if (!user) {
        return res.json({
          status: false,
          message: "User does not exist!!",
        });
      }

      const coinPlan = await CoinPlan.findById(req.body.coinPlanId);

      if (!coinPlan) {
        return res.json({
          status: false,
          message: "coinPlanId does not exist!!",
        });
      }

      user.coin += coinPlan.coin + coinPlan.extraCoin;
      user.purchasedCoin += coinPlan.coin + coinPlan.extraCoin;
      user.isCoinPlan = true;
      user.plan.planStartDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      user.plan.coinPlanId = coinPlan._id;

      await user.save();

      const history = new History();

      history.userId = user._id;
      history.coinPlanId = coinPlan._id;
      history.coin = coinPlan.coin + coinPlan.extraCoin;
      history.dollar = coinPlan.dollar;
      history.type = 2;
      history.paymentGateway = req.body.paymentGateway; // 1.GooglePlay 2.RazorPay 3.Stripe
      history.date = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      await history.save();

      return res.json({
        status: true,
        message: "Success!!",
        history,
      });
    } else {
      return res.json({
        status: false,
        message: "Oops!! Invalid details!!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

// all purchase coinHistory for admin
exports.purchaseHistory = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const addFieldQuery_ = {
      shortDate: {
        $toDate: { $arrayElemAt: [{ $split: ["$date", ", "] }, 0] },
      },
    };

    let dateFilterQuery = {};

    if (req.query.startDate && req.query.endDate) {
      sDate = req.query.startDate + "T00:00:00.000Z";
      eDate = req.query.endDate + "T00:00:00.000Z";

      dateFilterQuery = {
        shortDate: { $gte: new Date(sDate), $lte: new Date(eDate) },
      };
    }

    const history = await History.aggregate([
      { $match: { type: 2, coinPlanId: { $ne: null } } },
      {
        $addFields: addFieldQuery_,
      },
      {
        $match: dateFilterQuery,
      },
      {
        $sort: { date: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "coinplans",
          localField: "coinPlanId",
          foreignField: "_id",
          as: "coinPlan",
        },
      },
      {
        $unwind: {
          path: "$coinPlan",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          paymentGateway: 1,
          name: "$user.name",
          purchaseDate: "$date",
          analyticDate: 1,
          coin: 1,
          dollar: 1,
        },
      },
      {
        $facet: {
          history: [
            { $skip: (start - 1) * limit }, //how many records you want to skip
            { $limit: limit },
          ],
          pageInfo: [
            { $group: { _id: null, totalRecord: { $sum: 1 } } }, //get total records count
          ],
          planCoin: [
            {
              $group: {
                _id: null,
                totalCoin: {
                  $sum: "$coin",
                },
                totalDollar: {
                  $sum: "$dollar",
                },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Success!!",
      total:
        history[0].pageInfo.length > 0 ? history[0].pageInfo[0].totalRecord : 0,
      totalCoin:
        history[0].planCoin.length > 0 ? history[0].planCoin[0].totalCoin : 0,
      totalDollar:
        history[0].planCoin.length > 0 ? history[0].planCoin[0].totalDollar : 0,
      history: history[0].history,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};
