const Tag = require("../model/tag.model");

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({ deleted: false });
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
    const newTag = new Tag({ label });
    const savedTag = await newTag.save();
    res.status(201).json(savedTag);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const tag = await Tag.findById(tagId);
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
    const tag = await Tag.findByIdAndUpdate(tagId, { label }, { new: true });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
