const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/AuthMiddleware');
const { getUsers, createUser, updateUser, deleteUser, acceptUser, declineUser } = require('../controllers/userController');

router.get('/', protect, admin, getUsers);
router.post('/', protect, admin, createUser);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.put('/:id/accept', protect, admin, acceptUser);
router.put('/:id/decline', protect, admin, declineUser);

module.exports = router;
