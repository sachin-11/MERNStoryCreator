const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const Story = require('../models/Story');

// @route     GET api/story
// @desc      Get all users story
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const story = await Story.find({user: req.user.id}).sort({
      date: -1,
    });
    res.json(story);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/story
// @desc      Get single users story
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if(!story){
      return res.status(404).json({ success: true, message: 'No story found for that id'})
    }
    res.json(story);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




// @route     POST api/story
// @desc      Add new story
// @access    Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required')
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }

    const {name, email, phone, type} = req.body;

    try {
      const newStory = new Story({
        name,
        email,
        phone,
        type,
        user: req.user.id,
      });

      const story = await newStory.save();

      res.json(story);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     PUT api/story/:id
// @desc      Update story
// @access    Private
router.put('/:id', auth, async (req, res) => {
  const {name, email, phone, type} = req.body;

  // Build story object
  const storyFields = {};
  if (name) storyFields.name = name;
  if (email) storyFields.email = email;
  if (phone) storyFields.phone = phone;
  if (type) storyFields.type = type;

  try {
    let story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({msg: 'Story not found'});

    // Make sure user owns story
    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({msg: 'Not authorized'});
    }

    story = await Story.findByIdAndUpdate(
      req.params.id,
      {$set: storyFields},
      {new: true},
    );

    res.json(story);
  } catch (err) {
    console.error(er.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/story/:id
// @desc      Delete story
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({msg: 'story not found'});

    // Make sure user owns story
    if (story.user.toString() !== req.user.id) {
      return res.status(401).json({msg: 'Not authorized'});
    }

    await Story.findByIdAndRemove(req.params.id);

    res.json({msg: 'Contact removed'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


router.put('/:id', auth, async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(500).json({ success: false, message: 'No file upload is found'})
   
  }
  if (!req.files) {
    return res.status(500).json({ success: false, message: 'No file upload is found'})
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
     return res.status(500).json({ success: false, message: 'No file upload is found'})
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return res.status(500).json({ success: false, message: 'No file upload is found'})
    
  }

  // Create custom filename
  file.name = `photo_${story._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
       return res.status(500).json({ success: false, message: 'No file upload is found'})
    }

    await Story.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
})





module.exports = router;
