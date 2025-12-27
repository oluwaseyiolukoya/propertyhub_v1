import prisma from "../lib/db";

export interface CareerPostingData {
  title: string;
  department: string;
  location: string;
  type: string;
  remote: string;
  experience: string;
  description: string;
  requirements: string; // HTML string (same as description)
  responsibilities: string; // HTML string (same as description)
  salary?: string;
  benefits?: string; // HTML string (same as description)
  status?: string;
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

export class CareerService {
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
  async getPostingById(id: string) {
    const posting = await prisma.career_postings.findFirst({
      where: {
        id,
        status: "active",
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (posting) {
      // Increment view count
      await prisma.career_postings.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return posting;
  }

  /**
   * Get unique values for filters
   */
  async getFilterOptions() {
    const [departments, locations, types, remoteOptions, experienceLevels] =
      await Promise.all([
        prisma.career_postings.findMany({
          where: { status: "active", deletedAt: null },
          select: { department: true },
          distinct: ["department"],
        }),
        prisma.career_postings.findMany({
          where: { status: "active", deletedAt: null },
          select: { location: true },
          distinct: ["location"],
        }),
        prisma.career_postings.findMany({
          where: { status: "active", deletedAt: null },
          select: { type: true },
          distinct: ["type"],
        }),
        prisma.career_postings.findMany({
          where: { status: "active", deletedAt: null },
          select: { remote: true },
          distinct: ["remote"],
        }),
        prisma.career_postings.findMany({
          where: { status: "active", deletedAt: null },
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

  /**
   * Get career statistics (for admin dashboard)
   */
  async getPublicStatistics() {
    const [
      total,
      active,
      draft,
      closed,
      archived,
      totalViews,
      totalApplications,
    ] = await Promise.all([
      prisma.career_postings.count({
        where: { deletedAt: null },
      }),
      prisma.career_postings.count({
        where: {
          status: "active",
          deletedAt: null,
        },
      }),
      prisma.career_postings.count({
        where: {
          status: "draft",
          deletedAt: null,
        },
      }),
      prisma.career_postings.count({
        where: {
          status: "closed",
          deletedAt: null,
        },
      }),
      prisma.career_postings.count({
        where: {
          status: "archived",
          deletedAt: null,
        },
      }),
      prisma.career_postings.aggregate({
        where: { deletedAt: null },
        _sum: { viewCount: true },
      }),
      prisma.career_applications.count({
        where: {},
      }),
    ]);

    return {
      total,
      active,
      draft,
      closed,
      archived,
      totalViews: totalViews._sum.viewCount || 0,
      totalApplications,
    };
  }
}

export const careerService = new CareerService();
