const router = (Router) => {
  Router.get('/', (req, res) => {
    return res.send({ message: 'Router Config' });
  });

  return Router;
};
export default router;
