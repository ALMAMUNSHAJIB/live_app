const Admin = require("./admin.model");

//jwt token
const jwt = require("jsonwebtoken");

//config file
const config = require("../../config");

//nodemailer
const nodemailer = require("nodemailer");

//fs
const fs = require("fs");

//bcrypt
const bcrypt = require("bcryptjs");

//deleteFile
const { deleteFile } = require("../../util/deleteFile");
const { baseURL } = require("../../config");

//create admin [Backend]
exports.store = async (req, res) => {
  try {
    console.log("body----", req.body);
    console.log("file----", req.file);

    if (
      !req.body ||
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.file
    ) {
      return res
        .status(200)
        .json({ status: false, message: "Invalid details!!" });
    }

    const admin = new Admin();

    admin.name = req.body.name;
    admin.email = req.body.email;
    admin.password = bcrypt.hashSync(req.body.password, 10);
    admin.image = baseURL + req.file.path;
    admin.flag = req.body.flag ? req.body.flag : false;

    await admin.save(async (error, admin) => {
      if (error) {
        return res.status(200).json({
          status: false,
          error: error.message || "Internal Server Error!!",
        });
      } else {
        return res
          .status(200)
          .json({ status: true, message: "Admin Created Successful!!", admin });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error });
  }
};

//admin login [Backend]
exports.login = async (req, res) => {
  try {
    if (req.body && req.body.email && req.body.password) {
      const admin = await Admin.findOne({ email: req.body.email });

      if (!admin) {
        return res.status(200).send({
          status: false,
          message: "Oops ! Email doesn't exist!!",
        });
      }

      const isPassword = await bcrypt.compareSync(
        req.body.password,
        admin.password
      );

      if (!isPassword) {
        return res.status(200).send({
          status: false,
          message: "Oops ! Password doesn't match!!",
        });
      }

      const payload = {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        image: admin.image,
        flag: admin.flag,
        isActive: admin.isActive,
        // role: admin.role,
      };

      const token = jwt.sign(payload, config.JWT_SECRET);

      if (admin.isActive) {
        return res.status(200).json({
          status: true,
          message: "Admin Login Successfully!!",
          token,
        });
      } else {
        return res
          .status(200)
          .json({ status: false, message: "Admin does not exists!!" });
      }
    } else {
      return res
        .status(200)
        .send({ status: false, message: "Oops ! Invalid details!!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get admin profile [Backend]
exports.getAdminData = async (req, res) => {
  console.log(req);
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res
        .status(200)
        .json({ status: false, message: "Admin does not Exist" });
    }

    return res.status(200).json({ status: true, message: "Success!!", admin });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//update admin profile email and name [Backend]
exports.update = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin)
      return res
        .status(200)
        .json({ status: false, message: "Admin doesn't Exist!!" });

    admin.name = req.body.name;
    admin.email = req.body.email;

    await admin.save();

    return res.status(200).json({
      status: true,
      message: "Admin Updated Successfully!!",
      admin,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error!!" });
  }
};

//update admin profile image [Backend]
exports.updateImage = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      deleteFile(req.file);
      return res
        .status(200)
        .json({ status: false, message: "Admin does not Exist!" });
    }

    if (req.file) {
      if (fs.existsSync(admin.image)) {
        fs.unlinkSync(admin.image);
      }

      admin.image = baseURL + req.file.path;
    }

    await admin.save();

    return res.status(200).json({ status: true, message: "Success!!", admin });
  } catch (error) {
    console.log(error);
    deleteFile(req.file);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error!!" });
  }
};

//update admin password [Backend]
exports.updatePassword = async (req, res) => {
  try {
    if (req.body.oldPass || req.body.newPass || req.body.confirmPass) {
      Admin.findOne({ _id: req.admin._id }).exec(async (err, admin) => {
        if (err)
          return res.status(200).json({ status: false, message: err.message });
        else {
          const validPassword = bcrypt.compareSync(
            req.body.oldPass,
            admin.password
          );

          if (!validPassword)
            return res.status(200).json({
              status: false,
              message: "Oops ! Old Password doesn't match ",
            });

          if (req.body.newPass !== req.body.confirmPass) {
            return res.status(200).json({
              status: false,
              message: "Oops ! New Password and Confirm Password doesn't match",
            });
          }
          const hash = bcrypt.hashSync(req.body.newPass, 10);

          await Admin.updateOne(
            { _id: req.admin._id },
            { $set: { password: hash } }
          ).exec((error, updated) => {
            if (error)
              return res.status(200).json({
                status: false,
                message: error.message,
              });
            else
              return res.status(200).json({
                status: true,
                message: "Password changed Successfully",
              });
          });
        }
      });
    } else
      return res
        .status(200)
        .json({ status: false, message: "Invalid details" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  try {
    console.log("----body", req.body);

    const admin = await Admin.findOne({ email: req.body.email });

    console.log("----admin", admin);

    if (!admin) {
      return res
        .status(200)
        .json({ status: false, message: "Email does not Exist!" });
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        // user: config.EMAIL,
        // pass: config.PASSWORD,
        user: "madhurmk40@gmail.com",
        pass: "fdydknibeszaglxo",
      },
    });

    var tab = "";
    tab += "<!DOCTYPE html><html><head>";
    tab +=
      "<meta charset='utf-8'><meta http-equiv='x-ua-compatible' content='ie=edge'><meta name='viewport' content='width=device-width, initial-scale=1'>";
    tab += "<style type='text/css'>";
    tab +=
      " @media screen {@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 400;}";
    tab +=
      "@font-face {font-family: 'Source Sans Pro';font-style: normal;font-weight: 700;}}";
    tab +=
      "body,table,td,a {-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }";
    tab += "table,td {mso-table-rspace: 0pt;mso-table-lspace: 0pt;}";
    tab += "img {-ms-interpolation-mode: bicubic;}";
    tab +=
      "a[x-apple-data-detectors] {font-family: inherit !important;font-size: inherit !important;font-weight: inherit !important;line-height:inherit !important;color: inherit !important;text-decoration: none !important;}";
    tab += "div[style*='margin: 16px 0;'] {margin: 0 !important;}";
    tab +=
      "body {width: 100% !important;height: 100% !important;padding: 0 !important;margin: 0 !important;}";
    tab += "table {border-collapse: collapse !important;}";
    tab += "a {color: #1a82e2;}";
    tab +=
      "img {height: auto;line-height: 100%;text-decoration: none;border: 0;outline: none;}";
    tab += "</style></head><body>";
    tab += "<table border='0' cellpadding='0' cellspacing='0' width='100%'>";
    tab +=
      "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'>";
    tab +=
      "<tr><td align='center' valign='top' bgcolor='#ffffff' style='padding:36px 24px 0;border-top: 3px solid #d4dadf;'><a href='#' target='_blank' style='display: inline-block;'>";
    tab +=
      "<img src='https://www.stampready.net/dashboard/editor/user_uploads/zip_uploads/2018/11/23/5aXQYeDOR6ydb2JtSG0p3uvz/zip-for-upload/images/template1-icon.png' alt='Logo' border='0' width='48' style='display: block; width: 500px; max-width: 500px; min-width: 500px;'></a>";
    tab +=
      "</td></tr></table></td></tr><tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff'>";
    tab +=
      "<h1 style='margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;'>SET YOUR PASSWORD</h1></td></tr></table></td></tr>";
    tab +=
      "<tr><td align='center' bgcolor='#e9ecef'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px;'><tr><td align='center' bgcolor='#ffffff' style='padding: 24px; font-size: 16px; line-height: 24px;font-weight: 600'>";
    tab +=
      "<p style='margin: 0;'>Not to worry, We got you! Let's get you a new password.</p></td></tr><tr><td align='left' bgcolor='#ffffff'>";
    tab +=
      "<table border='0' cellpadding='0' cellspacing='0' width='100%'><tr><td align='center' bgcolor='#ffffff' style='padding: 12px;'>";
    tab +=
      "<table border='0' cellpadding='0' cellspacing='0'><tr><td align='center' style='border-radius: 4px;padding-bottom: 50px;'>";
    tab +=
      "<a href='" +
      config.baseURL +
      "changePassword/" +
      admin._id +
      "' target='_blank' style='display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;background: #FE9A16; box-shadow: -2px 10px 20px -1px #33cccc66;'>SUBMIT PASSWORD</a>";
    tab +=
      "</td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>";

    var mailOptions = {
      from: "madhurmk40@gmail.com",
      to: req.body.email,
      subject: "Sending Email from Hokoo",
      html: tab,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        return res.status(200).json({
          status: true,
          message: "Email send successfully",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};

//Set Admin Password
exports.setPassword = async (req, res, next) => {
  try {
    if (req.body.newPass || req.body.confirmPass) {
      Admin.findOne({ _id: req.params.adminId }).exec(async (err, admin) => {
        if (err)
          return res.status(200).json({ status: false, message: err.message });
        else {
          if (req.body.newPass !== req.body.confirmPass) {
            return res.status(200).json({
              status: false,
              message: "Oops ! New Password and Confirm Password doesn't match",
            });
          }
          bcrypt.hash(req.body.newPass, 10, (err, hash) => {
            if (err)
              return res.status(200).json({
                status: false,
                message: err.message,
              });
            else {
              Admin.update(
                { _id: req.params.adminId },
                { $set: { password: hash } }
              ).exec((error, updated) => {
                if (error)
                  return res.status(200).json({
                    status: false,
                    message: error.message,
                  });
                else
                  res.status(200).json({
                    status: true,
                    message: "Password Reset Successfully",
                  });
              });
            }
          });
        }
      });
    } else
      return res
        .status(200)
        .send({ status: false, message: "Invalid details!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "server error" });
  }
};
