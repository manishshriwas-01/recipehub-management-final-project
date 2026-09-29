import Collection from "../models/Collection.js";
import Recipe from "../models/Recipe.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

export const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    let coverImage = "";

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "recipehub/collections",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      coverImage = uploadResult.secure_url;
    }

    const collection = await Collection.create({
      owner: req.user.userId,
      name,
      coverImage,
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already have a collection with this name",
      });
    }

    next(error);
  }
};

export const getMyCollections = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      Collection.find({ owner: req.user.userId })
        .populate("recipes", "title image category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Collection.countDocuments({ owner: req.user.userId }),
    ]);

    return res.status(200).json({
      success: true,
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate("owner", "name")
      .populate("recipes", "title image category");

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const isOwner = collection.owner._id.toString() === req.user.userId;

    if (!collection.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this collection",
      });
    }

    return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (req, res, next) => {
  try {
    const { name, isPublic, coverImage } = req.body;

    const collection = await Collection.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (name !== undefined) collection.name = name;
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (coverImage !== undefined) collection.coverImage = coverImage;

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already have a collection with this name",
      });
    }

    next(error);
  }
};

export const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addRecipeToCollection = async (req, res, next) => {
  try {
    const { collectionId, recipeId } = req.params;

    const collection = await Collection.findOne({
      _id: collectionId,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    if (collection.recipes.some((id) => id.toString() === recipeId)) {
      return res.status(400).json({
        success: false,
        message: "Recipe is already in this collection",
      });
    }

    collection.recipes.push(recipeId);
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Recipe added to collection successfully",
      collection,
    });
  } catch (error) {
    next(error);
  }
};

export const removeRecipeFromCollection = async (req, res, next) => {
  try {
    const { collectionId, recipeId } = req.params;

    const collection = await Collection.findOne({
      _id: collectionId,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const recipeExists = collection.recipes.some(
      (id) => id.toString() === recipeId
    );

    if (!recipeExists) {
      return res.status(404).json({
        success: false,
        message: "Recipe is not in this collection",
      });
    }

    collection.recipes.pull(recipeId);
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Recipe removed from collection successfully",
      collection,
    });
  } catch (error) {
    next(error);
  }
};


export const shareCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (!collection.shareToken) {
      collection.shareToken = crypto.randomBytes(16).toString("hex");
    }

    collection.isPublic = true;

    await collection.save();
    const clientUrl =
  process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL_PRODUCTION
    : process.env.CLIENT_URL_LOCAL;

    const shareUrl = `${clientUrl}/shared-collection/${collection.shareToken}`;

    return res.status(200).json({
      success: true,
      message: "Collection shared successfully",
      shareUrl,
    });
  } catch (error) {
    next(error);
  }
};


export const unshareCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.isPublic = false;
    collection.shareToken = undefined;

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection sharing disabled",
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOne({
      shareToken: req.params.shareToken,
      isPublic: true,
    })
      .populate("owner", "name")
      .populate("recipes", "title image category");

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Shared collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    next(error);
  }
};