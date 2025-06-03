/**
 * UserService Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../services/UserService';
import type { NewUser, UserRole, InteractionType } from '../../../shared/src/types/database';

// Mock the database connection
vi.mock('../database/connection', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the database schema
vi.mock('../database/schema', () => ({
  users: {
    id: 'id',
    username: 'username',
    email: 'email',
    display_name: 'display_name',
    role: 'role',
    is_active: 'is_active',
    preferences: 'preferences',
    profile_data: 'profile_data',
    created_at: 'created_at',
    updated_at: 'updated_at',
    last_login_at: 'last_login_at',
  },
  userArchetypeInteractions: {
    id: 'id',
    user_id: 'user_id',
    archetype_id: 'archetype_id',
    interaction_type: 'interaction_type',
    metadata: 'metadata',
    created_at: 'created_at',
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockDb: any;

  beforeEach(() => {
    userService = new UserService();
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
    };

    // Mock the imported db
    const { db } = require('../database/connection');
    Object.assign(db, mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData: NewUser = {
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'user',
        preferences: { theme: 'dark' },
        profile_data: { bio: 'Test bio' },
      };

      const expectedUser = {
        id: '123',
        ...userData,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.create(userData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        ...userData,
        preferences: userData.preferences || {},
        profile_data: userData.profile_data || {},
      });
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should create user with default preferences and profile_data', async () => {
      const userData: NewUser = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      const expectedUser = {
        id: '123',
        ...userData,
        preferences: {},
        profile_data: {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.create(userData);

      expect(mockDb.values).toHaveBeenCalledWith({
        ...userData,
        preferences: {},
        profile_data: {},
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      const userId = '123';
      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user' as UserRole,
        is_active: true,
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.getById(userId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      const userId = '123';
      mockDb.returning.mockResolvedValue([]);

      const result = await userService.getById(userId);

      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return user when found by email', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: '123',
        username: 'testuser',
        email,
        role: 'user' as UserRole,
        is_active: true,
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.getByEmail(email);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockDb.returning.mockResolvedValue([]);

      const result = await userService.getByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('getByUsername', () => {
    it('should return user when found by username', async () => {
      const username = 'testuser';
      const expectedUser = {
        id: '123',
        username,
        email: 'test@example.com',
        role: 'user' as UserRole,
        is_active: true,
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.getByUsername(username);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by username', async () => {
      const username = 'nonexistent';
      mockDb.returning.mockResolvedValue([]);

      const result = await userService.getByUsername(username);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = '123';
      const updates = {
        display_name: 'Updated Name',
        preferences: { theme: 'light' },
      };

      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        ...updates,
        updated_at: expect.any(Date),
      };

      mockDb.returning.mockResolvedValue([expectedUser]);

      const result = await userService.update(userId, updates);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found for update', async () => {
      const userId = '123';
      const updates = { display_name: 'Updated Name' };

      mockDb.returning.mockResolvedValue([]);

      const result = await userService.update(userId, updates);

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences successfully', async () => {
      const userId = '123';
      const currentUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        preferences: { theme: 'dark', notifications_enabled: true },
      };

      const newPreferences = {
        theme: 'light' as const,
        privacy_level: 'private' as const,
      };

      const expectedUpdatedUser = {
        ...currentUser,
        preferences: {
          theme: 'light',
          notifications_enabled: true,
          privacy_level: 'private',
        },
        updated_at: expect.any(Date),
      };

      // Mock getById to return current user
      vi.spyOn(userService, 'getById').mockResolvedValue(currentUser as any);
      // Mock update to return updated user
      vi.spyOn(userService, 'update').mockResolvedValue(expectedUpdatedUser as any);

      const result = await userService.updatePreferences(userId, newPreferences);

      expect(userService.getById).toHaveBeenCalledWith(userId);
      expect(userService.update).toHaveBeenCalledWith(userId, {
        preferences: {
          theme: 'light',
          notifications_enabled: true,
          privacy_level: 'private',
        },
      });
      expect(result).toEqual(expectedUpdatedUser);
    });

    it('should return null when user not found for preferences update', async () => {
      const userId = '123';
      const newPreferences = { theme: 'light' as const };

      vi.spyOn(userService, 'getById').mockResolvedValue(null);

      const result = await userService.updatePreferences(userId, newPreferences);

      expect(result).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const userId = '123';
      const newRole: UserRole = 'moderator';

      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: newRole,
        updated_at: expect.any(Date),
      };

      vi.spyOn(userService, 'update').mockResolvedValue(expectedUser as any);

      const result = await userService.updateRole(userId, newRole);

      expect(userService.update).toHaveBeenCalledWith(userId, { role: newRole });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      const userId = '123';

      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        is_active: false,
        updated_at: expect.any(Date),
      };

      vi.spyOn(userService, 'update').mockResolvedValue(expectedUser as any);

      const result = await userService.deactivate(userId);

      expect(userService.update).toHaveBeenCalledWith(userId, { is_active: false });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('reactivate', () => {
    it('should reactivate user successfully', async () => {
      const userId = '123';

      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        updated_at: expect.any(Date),
      };

      vi.spyOn(userService, 'update').mockResolvedValue(expectedUser as any);

      const result = await userService.reactivate(userId);

      expect(userService.update).toHaveBeenCalledWith(userId, { is_active: true });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = '123';

      const expectedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        last_login_at: expect.any(Date),
        updated_at: expect.any(Date),
      };

      vi.spyOn(userService, 'update').mockResolvedValue(expectedUser as any);

      const result = await userService.updateLastLogin(userId);

      expect(userService.update).toHaveBeenCalledWith(userId, { 
        last_login_at: expect.any(Date) 
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('search', () => {
    it('should search users with filters', async () => {
      const options = {
        role: ['user', 'moderator'] as UserRole[],
        is_active: true,
        limit: 10,
        offset: 0,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      };

      const expectedUsers = [
        { id: '1', username: 'user1', role: 'user' },
        { id: '2', username: 'user2', role: 'moderator' },
      ];

      mockDb.returning.mockResolvedValue(expectedUsers);

      const result = await userService.search(options);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(expectedUsers);
    });

    it('should search users without filters', async () => {
      const expectedUsers = [
        { id: '1', username: 'user1', role: 'user' },
        { id: '2', username: 'user2', role: 'moderator' },
      ];

      mockDb.returning.mockResolvedValue(expectedUsers);

      const result = await userService.search();

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('recordInteraction', () => {
    it('should record user interaction successfully', async () => {
      const interactionData = {
        user_id: '123',
        archetype_id: '456',
        interaction_type: 'like' as InteractionType,
        metadata: { source: 'web' },
      };

      const expectedInteraction = {
        id: '789',
        ...interactionData,
        created_at: new Date(),
      };

      mockDb.returning.mockResolvedValue([expectedInteraction]);

      const result = await userService.recordInteraction(interactionData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        ...interactionData,
        metadata: interactionData.metadata || {},
      });
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(expectedInteraction);
    });
  });

  describe('getUserInteractions', () => {
    it('should get user interactions with filters', async () => {
      const userId = '123';
      const options = {
        interaction_types: ['like', 'save'] as InteractionType[],
        archetype_id: '456',
        limit: 10,
        offset: 0,
      };

      const expectedInteractions = [
        { id: '1', user_id: userId, interaction_type: 'like' },
        { id: '2', user_id: userId, interaction_type: 'save' },
      ];

      mockDb.returning.mockResolvedValue(expectedInteractions);

      const result = await userService.getUserInteractions(userId, options);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(expectedInteractions);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = '123';

      mockDb.returning.mockResolvedValue([{ id: userId }]);

      const result = await userService.delete(userId);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user not found for deletion', async () => {
      const userId = '123';

      mockDb.returning.mockResolvedValue([]);

      const result = await userService.delete(userId);

      expect(result).toBe(false);
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role', async () => {
      const role: UserRole = 'moderator';
      const expectedUsers = [
        { id: '1', username: 'mod1', role: 'moderator' },
        { id: '2', username: 'mod2', role: 'moderator' },
      ];

      mockDb.returning.mockResolvedValue(expectedUsers);

      const result = await userService.getUsersByRole(role);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('getModerators', () => {
    it('should get all moderators', async () => {
      const expectedModerators = [
        { id: '1', username: 'mod1', role: 'moderator' },
        { id: '2', username: 'mod2', role: 'moderator' },
      ];

      vi.spyOn(userService, 'getUsersByRole').mockResolvedValue(expectedModerators as any);

      const result = await userService.getModerators();

      expect(userService.getUsersByRole).toHaveBeenCalledWith('moderator');
      expect(result).toEqual(expectedModerators);
    });
  });

  describe('getAdmins', () => {
    it('should get all admins', async () => {
      const expectedAdmins = [
        { id: '1', username: 'admin1', role: 'admin' },
        { id: '2', username: 'admin2', role: 'admin' },
      ];

      vi.spyOn(userService, 'getUsersByRole').mockResolvedValue(expectedAdmins as any);

      const result = await userService.getAdmins();

      expect(userService.getUsersByRole).toHaveBeenCalledWith('admin');
      expect(result).toEqual(expectedAdmins);
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin users', () => {
      const adminUser = { role: 'admin' as UserRole } as any;
      
      const result = userService.hasPermission(adminUser, 'any_action');
      
      expect(result).toBe(true);
    });

    it('should return true for moderator users with moderation actions', () => {
      const moderatorUser = { role: 'moderator' as UserRole } as any;
      
      const result = userService.hasPermission(moderatorUser, 'moderate_content');
      
      expect(result).toBe(true);
    });

    it('should return false for regular users with admin actions', () => {
      const regularUser = { role: 'user' as UserRole } as any;
      
      const result = userService.hasPermission(regularUser, 'delete_user');
      
      expect(result).toBe(false);
    });

    it('should return true for regular users with basic actions', () => {
      const regularUser = { role: 'user' as UserRole } as any;
      
      const result = userService.hasPermission(regularUser, 'view_content');
      
      expect(result).toBe(true);
    });
  });
}); 