const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },

  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + `${file.fieldname}${ext}`);
  },
});

const filter = function (req, file, cb) {
  if (
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const image_upload = multer({
  storage: storage,
  fileFilter: filter,
});

module.exports = image_upload;