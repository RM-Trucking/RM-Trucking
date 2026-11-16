import { NextFunction, Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    userType?: 'EMPLOYEE' | 'CUSTOMER';
    customerId?: number | null;
    permissions?: string[];
  };
}

export const authorize = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userPermissions = req.user?.permissions ?? [];

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};
