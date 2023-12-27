const mongoose = require("mongoose");

const SubscriptionPermissionSchema = new mongoose.Schema(
  {
    permissionName: {
      type: String,
      required: true,
    },
    subscriptionCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionCategory',
      required: true,
    },
  },
  { timestamps: true }
);

const SubscriptionPermission = mongoose.model("SubscriptionPermission", SubscriptionPermissionSchema);

const SubscriptionCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const SubscriptionCategory = mongoose.model("SubscriptionCategory", SubscriptionCategorySchema);

module.exports = { SubscriptionPermission, SubscriptionCategory };
