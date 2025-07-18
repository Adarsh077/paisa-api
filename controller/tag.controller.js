const mongoose = require("mongoose");
const Tag = require("../model/tag.model");

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({ deleted: false, user: req.user._id }).select(
      "-user -createdAt -updatedAt -deleted"
    );
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) {
      return res.status(400).json({ error: "Label is required" });
    }
    const newTag = new Tag({ label, user: req.user._id });
    const savedTag = await newTag.save();
    const { user, createdAt, updatedAt, deleted, ...tagResponse } =
      savedTag.toObject();
    res.status(201).json(tagResponse);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const tag = await Tag.findOne({
      _id: mongoose.Types.ObjectId.createFromHexString(tagId),
      deleted: false,
      user: req.user._id,
    });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    tag.deleted = true;
    await tag.save();
    res.json({ message: "Tag deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { label } = req.body;
    if (!label) {
      return res.status(400).json({ error: "Label is required" });
    }
    const tag = await Tag.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId.createFromHexString(tagId),
        deleted: false,
        user: req.user._id,
      },
      { label },
      { new: true }
    ).select("-user -createdAt -updatedAt -deleted");
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
