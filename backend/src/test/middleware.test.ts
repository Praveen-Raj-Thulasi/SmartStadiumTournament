import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeNoSql, sanitizeXSS } from '../middleware/sanitize';
import { 
  validateAuth, 
  validateIncidentCreate, 
  validateIncidentDispatch, 
  validateMatchUpdate, 
  validateStaffCreate, 
  validateStaffStatusUpdate 
} from '../middleware/validation';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { errorHandler } from '../middleware/error';
import { Request, Response } from 'express';

describe('Backend Middleware Unit Tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    nextFunction = vi.fn();
  });

  describe('1. Sanitization Middleware', () => {
    it('sanitizeNoSql - should strip keys beginning with $ from request body', () => {
      mockRequest.body = {
        username: 'director',
        password: { $gt: '' },
        nested: {
          $invalid: 'value',
          valid: 'ok'
        }
      };

      sanitizeNoSql(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.password).toBeUndefined();
      expect(mockRequest.body.nested.$invalid).toBeUndefined();
      expect(mockRequest.body.nested.valid).toBe('ok');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('sanitizeXSS - should strip HTML tags from string properties in body', () => {
      mockRequest.body = {
        title: 'Safe Title',
        description: '<script>alert("xss")</script>This is <p>dangerous</p> string with onload="" attributes.',
        count: 123
      };

      sanitizeXSS(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.title).toBe('Safe Title');
      // Script tags, HTML tags, and attribute handlers should be stripped
      expect(mockRequest.body.description).toContain('This is dangerous string with  attributes.');
      expect(mockRequest.body.description).not.toContain('<script>');
      expect(mockRequest.body.description).not.toContain('<p>');
      expect(mockRequest.body.count).toBe(123);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('2. Validation Middleware', () => {
    it('validateAuth (login) - should allow valid payloads', () => {
      mockRequest.body = { username: 'director', password: 'password123' };
      
      validateAuth(false)(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('validateAuth (login) - should return 400 for short passwords', () => {
      mockRequest.body = { username: 'director', password: '123' };
      
      validateAuth(false)(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Password must be at least 6 characters')
      }));
    });

    it('validateIncidentCreate - should allow valid incidents', () => {
      mockRequest.body = {
        title: 'Leak',
        description: 'Water leak',
        category: 'maintenance',
        priority: 'low',
        zone: 'restrooms'
      };

      validateIncidentCreate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('validateIncidentCreate - should block invalid priority or category values', () => {
      mockRequest.body = {
        title: 'Leak',
        description: 'Water leak',
        category: 'unknown-category',
        priority: 'low',
        zone: 'restrooms'
      };

      validateIncidentCreate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Invalid incident category')
      }));
    });

    it('validateIncidentDispatch - should block missing staffId payloads', () => {
      mockRequest.body = {};

      validateIncidentDispatch(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('validateMatchUpdate - should block draws on completed matches', () => {
      mockRequest.body = {
        score1: 2,
        score2: 2,
        status: 'completed'
      };

      validateMatchUpdate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('matches cannot end in a draw')
      }));
    });

    it('validateStaffCreate - should block invalid staff roles', () => {
      mockRequest.body = {
        name: 'John Doe',
        role: 'manager'
      };

      validateStaffCreate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('validateStaffStatusUpdate - should block invalid status values', () => {
      mockRequest.body = {
        status: 'sleeping'
      };

      validateStaffStatusUpdate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('3. Auth / RBAC Middleware', () => {
    it('requireRole - should allow matching role sessions', () => {
      mockRequest.user = { id: '1', username: 'director', role: 'director' };
      
      requireRole(['director'])(mockRequest as any, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('requireRole - should return 403 for unauthorized roles', () => {
      mockRequest.user = { id: '2', username: 'guard', role: 'security' };
      
      requireRole(['director'])(mockRequest as any, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('4. Centralized Error Handler Middleware', () => {
    it('errorHandler - should respond with error structure', () => {
      const err = new Error('Database connection issue');
      
      errorHandler(err, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
});
