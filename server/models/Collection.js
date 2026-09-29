import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Collection owner is required"]
  },

  name: {
    type: String,
    required: [true, "Collection name is required"],
    trim: true,
    minlength: [2, "Collection name must be at least 2 characters"],
    maxlength: [50, "Collection name cannot exceed 50 characters"]
  },

  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe"
  }],

  coverImage: {
    type: String,
    default: ""
  },

  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },

  isPublic: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;