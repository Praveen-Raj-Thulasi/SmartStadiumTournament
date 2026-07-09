import { Request, Response, NextFunction } from 'express';

/**
 * Deeply cleans object inputs by deleting any keys that begin with '$'.
 * This prevents NoSQL injection attacks against Mongoose queries.
 */
const cleanNoSql = (obj: unknown): void => {
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  const record = obj as Record<string, unknown>;
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      if (key.startsWith('$')) {
        delete record[key];
      } else {
        cleanNoSql(record[key]);
        if (record[key] !== null && typeof record[key] === 'object' && Object.keys(record[key] as object).length === 0) {
          delete record[key];
        }
      }
    }
  }
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

const cleanXssObj = (obj: unknown): void => {
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  const record = obj as Record<string, unknown>;
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      if (typeof record[key] === 'string') {
        record[key] = cleanXss(record[key] as string);
      } else {
        cleanXssObj(record[key]);
      }
    }
  }
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
