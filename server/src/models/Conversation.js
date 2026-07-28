import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    _id: true,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "New conversation",
      trim: true,
      maxlength: 100,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({
  updatedAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema,
);

export default Conversation;