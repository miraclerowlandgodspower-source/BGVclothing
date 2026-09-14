const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            }
        },

        products: [
            {
                name: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true
                }
            }
        ],

        deliveryFee: {
            type: Number,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true
        },

        paymentReference: {
            type: String,
            required: true,
            unique: true
        },

        paymentStatus: {
            type: String,
            default: "pending"
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);