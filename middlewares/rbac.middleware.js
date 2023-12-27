

const checkVideoCallAccess = async function (socket, next) {
  try {
    const auth = await socketAuthencation(socket, next);
    const userRole = auth.user.role;

    if (userRole === "premium") {
      // User has premium access
      return next();
    } else {
      // User doesn't have sufficient privileges
      const errorMessage =
        "Forbidden: You do not have access to this feature. Please upgrade your account to premium.";
      socket.emit("error", errorMessage);
      return next(new Error("Forbidden: Insufficient privileges"));
    }
  } catch (error) {
    console.error("Error checking video call access:", error);
    socket.emit("error", "Internal Server Error");
    return next(new Error("Forbidden: Internal Server Error"));
  }
};

module.exports = { checkVideoCallAccess };
