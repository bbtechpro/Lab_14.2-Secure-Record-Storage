const router = require('express').Router();
const { Note } = require('../../models/Note');
const { authMiddleware } = require('../../utils/auth');
 
// Apply authMiddleware to all routes in this file
router.use(authMiddleware);
 
// GET /api/notes - Get all notes for the logged-in user

router.get('/', async (req, res) => {
 
// Filter “Get All Notes”: Modify the GET / route. Instead of returning all notes in the database, it should now only return the notes where the user field matches the _id of the currently authenticated user (req.user._id).

  try {
    const notes = await Note.find({ user: req.user._id });
    res.json(notes);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Secure “Get Single Note”: If you have a GET /:id route, apply the same ownership check there as well. Only return the note if the user field on that note matches the authenticated user’s _id. If they do not match, return a 403 Forbidden status with an appropriate error message.

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    if (note.user.toString() !== req.user._id) {
      return res.status(403).json({ message: 'User is not authorized to view this note.' });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
    
//  When a new note is created, you must associate it with the currently logged-in user. The authenticated user’s data should be available on req.user from the authentication middleware. Save the user’s _id to the new note’s user field.

    user: req.user._id

    });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json(err);
  }
});
 
// PUT /api/notes/:id - Update a note
router.put('/:id', async (req, res) => {
  try {
    
//   Secure “Update Note”: Modify the PUT /:id route. Before updating a note, you must first find the note by its ID. Then, check if the user field on that note matches the authenticated user’s _id.

// If they match, proceed with the update.
// If they do not match, return a 403 Forbidden status with an error message like "User is not authorized to update this note."

    // find the note by its ID
    const note = await Note.findById(req.params.id);  
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    // Check if the user is authorized to update this note
    if (note.user.toString() !== req.user._id) {
      return res.status(403).json({ message: 'User is not authorized to update this note.' });
    }
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// DELETE /api/notes/:id - Delete a note
// Secure “Delete Note”: Modify the DELETE /:id route. Similar to the update route, you must check for ownership before deleting a note.

// Find the note by its ID.
// If the user is the owner, delete the note.
// If the user is not the owner, return a 403 Forbidden status with an appropriate error message.

router.delete('/:id', async (req, res) => {
  try {
    // find the note by its ID
    const note = await Note.findById(req.params.id);

    // Check if the user is authorized to delete this note
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    if (note.user.toString() !== req.user._id) {
      return res.status(403).json({ message: 'User is not authorized to delete this note.' });
    }
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted!' });
  } catch (err) {
    res.status(500).json(err);
  }
});
 
module.exports = router;