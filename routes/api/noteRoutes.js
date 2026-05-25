const router = require('express').Router();
const { Note } = require('../../models');
const { authMiddleware } = require('../../utils/auth');
 
// Apply authMiddleware to all routes in this file
router.use(authMiddleware);
 
// GET /api/notes - Get all notes for the logged-in user
// THIS IS THE ROUTE THAT CURRENTLY HAS THE FLAW
router.get('/', async (req, res) => {
  // This currently finds all notes in the database.
  // It should only find notes owned by the logged in user.
   // Filter “Get All Notes”: Modify the GET / route. Instead of returning all notes in the database, it should now only return the notes where the user field matches the _id of the currently authenticated user (req.user._id).
  try {
    const notes = await Note.find({ user: req.user._id });
    res.json(notes);
  } catch (err) {
    res.status(500).json(err);
  }
});
 
// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
      // The user ID needs to be added here
    //   find the POST / route. When a new note is created, you must associate it with the currently logged-in user. The authenticated user’s data should be available on req.user from the authentication middleware. Save the user’s _id to the new note’s user field.
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
    // // This needs an authorization check
//     Secure “Update Note”: Modify the PUT /:id route. Before updating a note, you must first find the note by its ID. Then, check if the user field on that note matches the authenticated user’s _id.

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
router.delete('/:id', async (req, res) => {
  try {
    // This needs an authorization check
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    res.json({ message: 'Note deleted!' });
  } catch (err) {
    res.status(500).json(err);
  }
});
 
module.exports = router;