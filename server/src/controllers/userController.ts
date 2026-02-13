import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const address = req.body;

        if (!address.fullName || !address.phone || !address.address || !address.city || !address.pincode) {
            res.status(400).json({ error: 'All required address fields must be provided' });
            return;
        }

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If this is the first address or marked as default, make it default
        if (user.addresses.length === 0 || address.isDefault) {
            user.addresses.forEach((addr) => (addr.isDefault = false));
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Failed to add address' });
    }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { addressId } = req.params;
        const updates = req.body;

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        Object.assign(address, updates);

        if (updates.isDefault) {
            user.addresses.forEach((addr) => {
                if (addr._id?.toString() !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        await user.save();

        res.json(user);
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Failed to update address' });
    }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { addressId } = req.params;

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(addressId);

        // If deleted address was default, make the first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json(user);
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
};
