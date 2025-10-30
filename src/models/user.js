import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";
import bcrypt from "bcryptjs";

const User = sequelize.define(
  "user",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullname: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    username: {
      // username is just a display name for the user (not unique)
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please provide a valid email address",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
        len: {
          args: [5, 255],
          msg: "Email must be between 5 and 255 characters",
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password cannot be empty",
        },
        len: {
          args: [8, 255],
          msg: "Password must be at least 8 characters",
        },
      },
    },
    phone_number: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    users_country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

// Instance method to hash password
User.prototype.hashPassword = async function (password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hook to hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Hook to hash password before updating user (only if password is being updated)
User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

export default User;
