const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).send("User already registered.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    await user.save();

    const userResult = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).send({ user: userResult });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send(error.message);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ message: "User with this email does not exist." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).send({ message: "Password is incorrect." });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.send({ token, userId: user._id });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getName = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString("default", { month: "short" });
    const year = currentDate.getFullYear();
    const formattedDate = `${day} ${month}, ${year}`;

    res.json({ name: user.name, currentDate: formattedDate });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    console.log("Received request to update user settings");

    const user = await User.findById(req.user.id);
    console.log("User found:", user);

    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Old password is incorrect");
      return res.status(400).send("Old password is incorrect");
    }

    if (req.body.newPassword) {
      user.password = await bcrypt.hash(req.body.newPassword, 8);
    }

    await user.save();
    console.log("User settings updated successfully");

    res.send("User updated successfully");
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).send(error.message);
  }
};
