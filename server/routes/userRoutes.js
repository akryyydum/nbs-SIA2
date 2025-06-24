const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/AuthMiddleware');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

router.get('/', protect, admin, getUsers);
router.post('/', protect, admin, createUser);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
