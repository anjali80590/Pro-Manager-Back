const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Low" },
  checklist: [{ text: String, isCompleted: { type: Boolean, default: false } }],
  dueDate: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Backlog", "To-Do", "Progress", "Done"],
    default: "To-Do",
  },
  createdAt: { type: Date, default: Date.now }, 
});
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
