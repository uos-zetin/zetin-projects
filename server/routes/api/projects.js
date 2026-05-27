import { Router } from 'express';
import admin from '../../middlewares/admin.js';
import { readProjects, addProject, updateProject, deleteProject, reorder } from '../../lib/store.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await readProjects());
  } catch (err) {
    next(err);
  }
});

router.post('/', admin(), async (req, res, next) => {
  try {
    await addProject(req.body);
    res.json(req.body);
  } catch (err) {
    next(err);
  }
});

router.put('/order', admin(), async (req, res, next) => {
  try {
    await reorder(req.body.ids || []);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', admin(), async (req, res, next) => {
  try {
    await updateProject(req.params.id, req.body);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', admin(), async (req, res, next) => {
  try {
    await deleteProject(req.params.id);
    res.json({ status: 'success' });
  } catch (err) {
    next(err);
  }
});

export default router;
