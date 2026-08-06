const Account = require('../models/Account');

const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ role: { $in: ['Pharmacy', 'Lab', 'Scan'] } });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createAccount = async (req, res) => {
    const { userName, email, password, role } = req.body;
    try {
        const existing = await Account.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Account already exists with this email' });
        }
        
        const account = await Account.create({
            userName,
            email,
            password,
            role,
            activeStatus: true
        });
        
        res.status(201).json(account.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAccount = async (req, res) => {
    const { id } = req.params;
    const { userName, email, password, role, activeStatus } = req.body;
    try {
        const updateData = { userName, email, role, activeStatus };
        if (password) {
            updateData.password = password;
        }
        
        const updated = await Account.findByIdAndUpdate(id, updateData);
        if (!updated) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        res.json(updated.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Account.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount
};
