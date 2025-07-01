const express = require('express');
const router = express.Router();
const { protect, adminOrSupplier, admin, canEditProfile } = require('../middleware/AuthMiddleware');
const { getUsers, createUser, updateUser, deleteUser, acceptUser, declineUser } = require('../controllers/userController');

router.get('/', protect, adminOrSupplier, getUsers);
router.post('/', protect, admin, createUser);
// Allow any user to update their own profile, admin can update anyone
router.put('/:id', protect, canEditProfile, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.put('/:id/accept', protect, admin, acceptUser);
router.put('/:id/decline', protect, admin, declineUser);

module.exports = router;
