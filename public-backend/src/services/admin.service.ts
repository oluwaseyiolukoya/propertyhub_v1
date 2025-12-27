import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import prisma from "../lib/db";

export interface CreateAdminData {
  email: string;
  name: string;
  password: string;
  role?: "admin" | "editor" | "viewer";
}

export interface UpdateAdminData {
  name?: string;
  email?: string;
  role?: "admin" | "editor" | "viewer";
  isActive?: boolean;
  password?: string;
}

export class AdminService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Create a new admin user
   */
  async createAdmin(data: CreateAdminData) {
    // Check if admin with email already exists
    const existing = await prisma.public_admins.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error("Admin with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create admin
    const admin = await prisma.public_admins.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || "editor",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        pagePermissions: true,
        createdAt: true,
        updatedAt: true,
        // Don't return password
      },
    });

    return admin;
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string) {
    const admin = await prisma.public_admins.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        pagePermissions: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  /**
   * Get admin by email
   */
  async getAdminByEmail(email: string) {
    const admin = await prisma.public_admins.findUnique({
      where: { email },
    });

    return admin;
  }

  /**
   * Authenticate admin (login)
   */
  async authenticateAdmin(email: string, password: string) {
    // Find admin by email
    const admin = await this.getAdminByEmail(email);

    if (!admin) {
      throw new Error("Invalid email or password");
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new Error("Admin account is deactivated");
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, admin.password);

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await prisma.public_admins.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  /**
   * Update admin
   */
  async updateAdmin(id: string, data: UpdateAdminData) {
    // If updating email, check if it's already taken
    if (data.email) {
      const existing = await prisma.public_admins.findUnique({
        where: { email: data.email },
      });

      if (existing && existing.id !== id) {
        throw new Error("Email is already taken");
      }
    }

    // If updating password, hash it
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    const admin = await prisma.public_admins.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        pagePermissions: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  /**
   * Deactivate admin (soft delete)
   */
  async deactivateAdmin(id: string) {
    const admin = await prisma.public_admins.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        pagePermissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  /**
   * List all admins
   */
  async listAdmins() {
    const admins = await prisma.public_admins.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        pagePermissions: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return admins;
  }

  /**
   * Log admin activity
   */
  async logActivity(
    adminId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    await prisma.public_admin_activity_logs.create({
      data: {
        adminId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
      },
    });
  }
}

export default new AdminService();
