export const use = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);


// Use this in controller like below

// export const getUser = use(async (req: Request, res: Response, next: NextFunction) => {
//   const user = await userService.findById(req.params.id);
//   if (!user) throw new Error('User not found');
//   res.json(user);
// });