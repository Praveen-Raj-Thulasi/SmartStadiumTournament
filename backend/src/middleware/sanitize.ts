import { Request, Response, NextFunction } from 'express';

/**
 * Deeply cleans object inputs by deleting any keys that begin with '$'.
 * This prevents NoSQL injection attacks against Mongoose queries.
 */
const cleanNoSql = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        cleanNoSql(obj[key]);
        if (obj[key] !== null && typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      }
    }
  }
  return obj;
};

/**
 * Strips HTML tags and potential script/event handlers from string properties recursively.
 * This blocks Cross-Site Scripting (XSS) injections in persistent data fields.
 */
const cleanXss = (val: string): string => {
  return val
    .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ''); // Strip all remaining HTML tags
};

const cleanXssObj = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'string') {
        obj[key] = cleanXss(obj[key]);
      } else {
        cleanXssObj(obj[key]);
      }
    }
  }
  return obj;
};

/**
 * Middleware that sanitizes all incoming payloads (body, query, and params) from NoSQL operator keys.
 */
export const sanitizeNoSql = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) cleanNoSql(req.body);
  if (req.query) cleanNoSql(req.query);
  if (req.params) cleanNoSql(req.params);
  next();
};

/**
 * Middleware that sanitizes incoming string inputs (body, query, and params) to remove XSS tags.
 */
export const sanitizeXSS = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) cleanXssObj(req.body);
  if (req.query) cleanXssObj(req.query);
  if (req.params) cleanXssObj(req.params);
  next();
};
