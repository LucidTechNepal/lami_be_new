const router = require("express").Router();
const subscriptionDTO = require("../dto/subscriptionDto");
const Subscription = require("../models/subscription");
const {Clients} = require("../models/client");
const UserSubscription = require("../models/userSubscription");

const UserSubscriptionStatus = {
  NOTSTARTED: "NOTSTARTED",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELED",
};

const PaymentStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  CANCELED: "CANCELED",
};

router.post("/", async (req, res) => {
  const { error, value } = subscriptionDTO.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  console.log(value);

  try {
    const pricing = value.pricing.map((pricingItem) => ({
      duration: pricingItem.duration,
      price: pricingItem.price,
    }));

    console.log(pricing, "pricing");

    const newSubscription = await Subscription.create({
      name: value.name,
      description: value.description,
      price: value.price,
      pricing: pricing,
      features: value.features,
    });

    res.status(201).json({
      message: "Subscription package created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// fetch all package

router.get("/", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json({
      message: "Subscriptions retrieved successfully",
      subscriptions: subscriptions,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// get package by id
router.get("/:id", async (req, res) => {
  const subscriptionId = req.params.id;

  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      message: "Subscription retrieved successfully",
      subscription: subscription,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// api for subscribe
router.post("/subscribe", async (req, res) => {
  try {
    const { userId, packageId, duration, paymentDetails } = req.body;

    const startDate = new Date();
    let endDate;

    if (duration === 1) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === 12) {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      throw new Error("Invalid package duration");
    }

    const status = "Active";
    const paymentStatus = "Successful";

    // Create a new UserSubscription instance
    const userSubscription = new UserSubscription({
      userId,
      packageId,
      startDate,
      endDate,
      status,
      paymentDetails: {
        ...paymentDetails,
        paymentStatus: paymentStatus,
      },
    });

    // Save the UserSubscription to the database
    const savedUserSubscription = await userSubscription.save();

    // Update user type
    if (savedUserSubscription) {
      const updatedClient = await Clients.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            role: "premium"
          },
        },
        { new: true }
      );
    }

    res.status(201).json({
      message: "Subscription successful",
     
      
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
