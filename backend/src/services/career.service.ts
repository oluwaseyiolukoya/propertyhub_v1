import prisma from "../lib/db";
import { randomUUID } from "crypto";

export interface CareerPostingData {
  title: string;
  department: string;
  location: string;
  type: string; // "Full-time", "Part-time", "Contract", etc.
  remote: string; // "Remote", "Hybrid", "On-site"
  experience: string; // "Entry-level", "Mid-level", "Senior", etc.
  description: string;
  requirements: string[];
  salary?: string;
  status?: string; // "active", "draft", "closed", "archived"
  expiresAt?: Date;
  metadata?: any;
}

export interface CareerPostingFilters {
  status?: string;
  department?: string;
  location?: string;
  type?: string;
  remote?: string;
  experience?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CareerPostingUpdate {
  title?: string;
  department?: string;
  location?: string;
  type?: string;
  remote?: string;
  experience?: string;
  description?: string;
  requirements?: string[];
  salary?: string;
  status?: string;
  expiresAt?: Date;
  metadata?: any;
}

export class CareerService {
  /**
   * Create a new career posting
   */
  async createPosting(data: CareerPostingData, postedBy?: string) {
    const posting = await prisma.career_postings.create({
      data: {
        id: randomUUID(),
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        remote: data.remote,
        experience: data.experience,
        description: data.description,
        requirements: data.requirements,
        salary: data.salary,
        status: data.status || "draft",
        postedBy: postedBy,
        expiresAt: data.expiresAt,
        metadata: data.metadata,
      },
    });

    return posting;
  }

  /**
   * Get all career postings with filters
   */
  async getPostings(filters: CareerPostingFilters = {}) {
    const {
      status,
      department,
      location,
      type,
      remote,
      experience,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null, // Only non-deleted postings
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (department && department !== "all") {
      where.department = department;
    }

    if (location && location !== "all") {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (remote && remote !== "all") {
      where.remote = remote;
    }

    if (experience && experience !== "all") {
      where.experience = experience;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.career_postings.count({ where });

    // Get postings
    const postings = await prisma.career_postings.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip,
      take: limit,
    });

    return {
      postings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get public career postings (active only)
   */
  async getPublicPostings(filters: CareerPostingFilters = {}) {
    const {
      department,
      location,
      type,
      remote,
      experience,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause - only active, not expired
    const where: any = {
      status: "active",
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    if (department && department !== "all") {
      where.department = department;
    }

    if (location && location !== "all") {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (remote && remote !== "all") {
      where.remote = remote;
    }

    if (experience && experience !== "all") {
      where.experience = experience;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Get total count
    const total = await prisma.career_postings.count({ where });

    // Get postings
    const postings = await prisma.career_postings.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip,
      take: limit,
    });

    // Increment view count for each posting
    await Promise.all(
      postings.map((posting) =>
        prisma.career_postings.update({
          where: { id: posting.id },
          data: { viewCount: { increment: 1 } },
        })
      )
    );

    return {
      postings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single career posting by ID
   */
  async getPostingById(id: string, isPublic = false) {
    const where: any = { id, deletedAt: null };

    if (isPublic) {
      where.status = "active";
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }

    const posting = await prisma.career_postings.findFirst({
      where,
    });

    if (!posting) {
      return null;
    }

    // Increment view count for public views
    if (isPublic) {
      await prisma.career_postings.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return posting;
  }

  /**
   * Update a career posting
   */
  async updatePosting(id: string, data: CareerPostingUpdate) {
    const posting = await prisma.career_postings.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return posting;
  }

  /**
   * Delete a career posting (soft delete)
   */
  async deletePosting(id: string) {
    const posting = await prisma.career_postings.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "archived",
      },
    });

    return posting;
  }

  /**
   * Permanently delete a career posting
   */
  async permanentDeletePosting(id: string) {
    const posting = await prisma.career_postings.delete({
      where: { id },
    });

    return posting;
  }

  /**
   * Get statistics for career postings
   */
  async getStatistics() {
    const [total, active, draft, closed, archived] = await Promise.all([
      prisma.career_postings.count({
        where: { deletedAt: null },
      }),
      prisma.career_postings.count({
        where: { status: "active", deletedAt: null },
      }),
      prisma.career_postings.count({
        where: { status: "draft", deletedAt: null },
      }),
      prisma.career_postings.count({
        where: { status: "closed", deletedAt: null },
      }),
      prisma.career_postings.count({
        where: { status: "archived", deletedAt: null },
      }),
    ]);

    const totalViews = await prisma.career_postings.aggregate({
      where: { deletedAt: null },
      _sum: { viewCount: true },
    });

    const totalApplications = await prisma.career_postings.aggregate({
      where: { deletedAt: null },
      _sum: { applicationCount: true },
    });

    return {
      total,
      active,
      draft,
      closed,
      archived,
      totalViews: totalViews._sum.viewCount || 0,
      totalApplications: totalApplications._sum.applicationCount || 0,
    };
  }

  /**
   * Get unique values for filters
   */
  async getFilterOptions() {
    const [departments, locations, types, remoteOptions, experienceLevels] =
      await Promise.all([
        prisma.career_postings.findMany({
          where: { deletedAt: null },
          select: { department: true },
          distinct: ["department"],
        }),
        prisma.career_postings.findMany({
          where: { deletedAt: null },
          select: { location: true },
          distinct: ["location"],
        }),
        prisma.career_postings.findMany({
          where: { deletedAt: null },
          select: { type: true },
          distinct: ["type"],
        }),
        prisma.career_postings.findMany({
          where: { deletedAt: null },
          select: { remote: true },
          distinct: ["remote"],
        }),
        prisma.career_postings.findMany({
          where: { deletedAt: null },
          select: { experience: true },
          distinct: ["experience"],
        }),
      ]);

    return {
      departments: departments.map((d) => d.department).filter(Boolean),
      locations: locations.map((l) => l.location).filter(Boolean),
      types: types.map((t) => t.type).filter(Boolean),
      remoteOptions: remoteOptions.map((r) => r.remote).filter(Boolean),
      experienceLevels: experienceLevels
        .map((e) => e.experience)
        .filter(Boolean),
    };
  }
}

export const careerService = new CareerService();







