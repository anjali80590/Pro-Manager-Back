const Task = require("../models/Task");
const mongoose = require("mongoose");

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userId;

    let tasks = await Task.find({ user: userId }).populate(
      "user",
      "username email"
    );

    tasks = tasks.map((task) => {
      const taskObject = task.toObject();

      const totalChecklistCount = task.checklist.length;
      const markedChecklistCount = task.checklist.filter(
        (item) => item.isCompleted
      ).length;

      taskObject.totalChecklistCount = totalChecklistCount;
      taskObject.markedChecklistCount = markedChecklistCount;

      return taskObject;
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { userId } = req;
    const taskData = {
      ...req.body,
      user: userId,
    };

    const task = new Task(taskData);
    console.log(task);
    await task.save();

    const totalChecklistCount = task.checklist.length;
    const markedChecklistCount = task.checklist.filter(
      (item) => item.isCompleted
    ).length;

    const taskResponse = task.toObject();
    taskResponse.markedChecklistCount = markedChecklistCount;
    taskResponse.totalChecklistCount = totalChecklistCount;

    res.status(201).json(taskResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    const { isCompleted } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const checklistItem = task.checklist.id(itemId);

    if (!checklistItem) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    checklistItem.isCompleted = isCompleted;

    await task.save();

    const totalChecklistCount = task.checklist.length;
    const markedChecklistCount = task.checklist.filter(
      (item) => item.isCompleted
    ).length;

    res.status(200).json({
      message: "Checklist item updated successfully",
      task: { ...task.toObject(), totalChecklistCount, markedChecklistCount },
    });
  } catch (error) {
    console.error("Error updating checklist item:", error);
    res.status(500).json({ error: "Failed to update checklist item" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Backlog", "To-Do", "Progress", "Done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status: status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
};

exports.shareTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      console.log(`Task with ID ${taskId} not found.`);
      return res.status(404).json({ error: "Task not found" });
    }

    const shareableLink = `${req.protocol}://${req.get(
      "host"
    )}/tasks/${taskId}`;

    console.log(`Shareable link: ${shareableLink}`);

    res
      .status(200)
      .json({ message: "Task shared successfully", shareableLink });
  } catch (error) {
    console.error("Error sharing task:", error);
    res.status(500).json({ error: "Failed to share task" });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

exports.getTasksByStatusAndPriority = async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log("Fetching tasks for user:", userId);

    const tasks = await Task.find({ user: userId })
      .sort({ dueDate: 1 })
      .populate("user", "username email");

    console.log("Fetched tasks:", tasks);

    const backlogTasks = tasks.filter((task) => task.status === "Backlog");
    const todoTasks = tasks.filter((task) => task.status === "To-Do");
    const progressTasks = tasks.filter((task) => task.status === "Progress");
    const doneTasks = tasks.filter((task) => task.status === "Done");
    const highPriorityTasksCount = tasks.filter(
      (task) => task.priority === "High"
    ).length;
    const mediumPriorityTasksCount = tasks.filter(
      (task) => task.priority === "Medium"
    ).length;
    const lowPriorityTasksCount = tasks.filter(
      (task) => task.priority === "Low"
    ).length;

    const today = new Date();
    // const dueDatePassedTasksCount = tasks.filter(
    //   (task) => task.dueDate < today
    // ).length;
    const dueDatePassedTasksCount = tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < today
    ).length;
    
    const totalBacklogTasks = backlogTasks.length;
    const totalTodoTasks = todoTasks.length;
    const totalProgressTasks = progressTasks.length;
    const totalDoneTasks = doneTasks.length;

    res.status(200).json({
      totalBacklogTasks,
      totalTodoTasks,
      totalProgressTasks,
      totalDoneTasks,
      highPriorityTasksCount,
      mediumPriorityTasksCount,
      lowPriorityTasksCount,
      dueDatePassedTasksCount,
    });
  } catch (error) {
    console.error("Error fetching tasks by status and priority:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch tasks by status and priority" });
  }
};

const moment = require("moment");

exports.filter = async (req, res) => {
  try {
    const { timeFrame } = req.query;
    const userId = req.userId;

    console.log(
      `Filtering tasks for time frame: ${timeFrame} for user: ${userId}`
    );

    let filter = { user: new mongoose.Types.ObjectId(userId) };

    let startDate, endDate;
    switch (timeFrame) {
      case "today":
        startDate = moment.utc().startOf("day").toDate();
        endDate = moment.utc().endOf("day").toDate();
        break;
      case "week":
        startDate = moment.utc().startOf("isoWeek").toDate();
        endDate = moment.utc().endOf("isoWeek").toDate();
        break;
      case "month":
        startDate = moment.utc().startOf("month").toDate();
        endDate = moment.utc().endOf("month").toDate();
        break;
      default:
        console.error("Invalid time frame specified");
        return res.status(400).send("Invalid time frame specified");
    }

    filter.createdAt = { $gte: startDate, $lte: endDate };

    const tasks = await Task.find(filter);
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error("Error filtering tasks:", error);
    res.status(500).send("Internal Server Error");
  }
};
