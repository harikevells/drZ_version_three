const Razorpay = require('razorpay');

const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount, // amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await instance.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ error: 'Some error occured in creating order' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
};

module.exports = {
    createOrder
};
