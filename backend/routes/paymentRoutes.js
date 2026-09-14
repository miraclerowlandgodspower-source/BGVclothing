const express = require("express");
const axios = require("axios");
const Order = require("../models/Order");
const router = express.Router();


// ==========================================
// DELIVERY RATES BY STATE
// (must match the frontend's checkout.html table)
// ==========================================

const deliveryRates = {
    "Lagos": 2000,
    "Abuja": 3500,
    "Rivers": 4000,
    "Delta": 4000,
    "Oyo": 3000,
    "Enugu": 4500,
    "Anambra": 4500,
    "Edo": 4000,
    "Kano": 5000,
    "Kaduna": 5000,
    "Other": 6000
};


function getDeliveryFee(state) {

    return deliveryRates[state] || deliveryRates["Other"];

}


// ==========================================
// INITIALIZE PAYMENT
// ==========================================

router.post("/initialize", async (req, res) => {
    try {

        const {
    email,
    name,
    phone,
    address,
    city,
    state,
    products
} = req.body;


        if (
    !email ||
    !name ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !products ||
    products.length === 0
) {
    return res.status(400).json({
        message: "Please provide all order information"
    });
}


        // ==========================================
        // RECALCULATE SUBTOTAL + DELIVERY SERVER-SIDE
        // (never trust an amount sent from the browser)
        // ==========================================

        const subtotal = products.reduce(
            (sum, item) =>
                sum + (Number(item.price) * Number(item.quantity)),
            0
        );

        const delivery = getDeliveryFee(state);

        const amount = subtotal + delivery;


        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
    email: email,

    amount: Math.round(
        Number(amount) * 100
    ),

    currency: "NGN",

    callback_url:
        `${process.env.FRONTEND_URL}/checkout.html`,

    metadata: {
        name: name,
        phone: phone,
        address: address,
        city: city,
        state: state,
        products: products,
        deliveryFee: delivery,
        totalAmount: Number(amount)
    }
},
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );


        res.status(200).json({
            status: true,

            message:
                "Payment initialized",

            data:
                response.data.data
        });


    } catch (error) {

        console.error(
            "Paystack initialization error:",
            error.response?.data ||
            error.message
        );


        res.status(500).json({
            message:
                "Unable to initialize payment"
        });

    }
});



// ==========================================
// VERIFY PAYMENT
// ==========================================

router.get(
    "/verify/:reference",
    async (req, res) => {

        try {

            const {
                reference
            } = req.params;


            if (!reference) {

                return res.status(400).json({
                    message:
                        "Payment reference is required"
                });

            }


            const response =
                await axios.get(
                    `https://api.paystack.co/transaction/verify/${reference}`,

                    {
                        headers: {

                            Authorization:
                                `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

                            "Content-Type":
                                "application/json"

                        }
                    }
                );


            const payment =
                response.data.data;


if (
    payment.status !== "success"
) {

    return res.status(400).json({

        status: false,

        message:
            "Payment was not successful",

        data: payment

    });

}


// ==========================================
// SAVE ORDER TO MONGODB
// ==========================================

const metadata =
    payment.metadata || {};


const existingOrder =
    await Order.findOne({

        paymentReference:
            payment.reference

    });


if (!existingOrder) {

    await Order.create({

        customer: {

            name:
                metadata.name,

            email:
                payment.customer.email,

            phone:
                metadata.phone,

            address:
                metadata.address,

            city:
                metadata.city,

            state:
                metadata.state

        },

        products:
            metadata.products || [],

        deliveryFee:
            metadata.deliveryFee || 0,

        totalAmount:
            Number(payment.amount) / 100,

        paymentReference:
            payment.reference,

        paymentStatus:
            "paid"

    });

}                     
// ==========================================
// GET SAVED ORDER
// ==========================================

const savedOrder =
    await Order.findOne({
        paymentReference:
            payment.reference
    });


// ==========================================
// SEND ORDER INFORMATION
// ==========================================

res.status(200).json({

    status: true,

    message:
        "Payment verified successfully",

    data: {

        reference:
            payment.reference,

        amount:
            payment.amount,

        status:
            payment.status,

        email:
            payment.customer.email,

        customer:
            savedOrder
                ? savedOrder.customer
                : null,

        products:
            savedOrder
                ? savedOrder.products
                : [],

        deliveryFee:
            savedOrder
                ? savedOrder.deliveryFee
                : (metadata.deliveryFee || 0),

        totalAmount:
            savedOrder
                ? savedOrder.totalAmount
                : Number(payment.amount) / 100

    }

});


        } catch (error) {

            console.error(
                "Paystack verification error:",
                error.response?.data ||
                error.message
            );


            res.status(500).json({

                status: false,

                message:
                    "Unable to verify payment"

            });

        }

    }
);


module.exports = router;