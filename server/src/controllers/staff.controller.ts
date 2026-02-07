import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { AuthRequest } from '../types';

export async function getStaff(req: AuthRequest, res: Response) {
  try {
    const { department, designation, search, organizationId } = req.query;
    const where: any = {};
    if (department) where.department = department;
    if (designation) where.designation = designation;
    if (organizationId) {
      where.staffOrgs = { some: { organizationId: parseInt(organizationId as string) } };
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const staff = await prisma.staffMember.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        staffOrgs: { include: { organization: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personal' });
  }
}

export async function getStaffMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staffMember.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        teacherAssignments: { include: { subject: true, class: true, section: true } },
        staffOrgs: { include: { organization: true } },
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personal' });
  }
}

export async function createStaff(req: AuthRequest, res: Response) {
  try {
    const { name, department, designation, phone, email, joinDate, password, role, organizationIds } = req.body;

    let userId: number | undefined;

    // If email and password provided, create a User account
    if (email && password) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'El email ya esta registrado como usuario' });
      }

      const hashed = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          name,
          role: role || 'TEACHER',
          phone,
          cargo: designation,
        },
      });
      userId = user.id;
    }

    const staffData: any = { name, department, designation, phone, email };
    if (joinDate) staffData.joinDate = new Date(joinDate);
    if (userId) staffData.userId = userId;

    const staff = await prisma.staffMember.create({ data: staffData });

    // Create org associations
    if (organizationIds && organizationIds.length > 0) {
      await prisma.staffOrganization.createMany({
        data: organizationIds.map((orgId: number) => ({ staffId: staff.id, organizationId: orgId })),
      });
    }

    const full = await prisma.staffMember.findUnique({
      where: { id: staff.id },
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        staffOrgs: { include: { organization: true } },
      },
    });
    res.status(201).json(full);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear personal' });
  }
}

export async function updateStaff(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, department, designation, phone, email, joinDate, password, role, active, organizationIds } = req.body;

    const existing = await prisma.staffMember.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    // Update user account if exists
    if (existing.userId) {
      const userData: any = {};
      if (name) userData.name = name;
      if (role) userData.role = role;
      if (phone) userData.phone = phone;
      if (designation) userData.cargo = designation;
      if (active !== undefined) userData.active = active;
      if (password) userData.password = await hashPassword(password);

      await prisma.user.update({ where: { id: existing.userId }, data: userData });
    } else if (email && password) {
      // Create a new user account for this staff member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya esta registrado' });
      }
      const hashed = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, password: hashed, name: name || existing.name, role: role || 'TEACHER', phone, cargo: designation },
      });
      await prisma.staffMember.update({ where: { id: parseInt(id) }, data: { userId: user.id } });
    }

    // Update staff fields
    const staffData: any = {};
    if (name) staffData.name = name;
    if (department !== undefined) staffData.department = department;
    if (designation !== undefined) staffData.designation = designation;
    if (phone !== undefined) staffData.phone = phone;
    if (email !== undefined) staffData.email = email;
    if (joinDate) staffData.joinDate = new Date(joinDate);

    const staff = await prisma.staffMember.update({
      where: { id: parseInt(id) },
      data: staffData,
    });

    // Update org associations if provided
    if (organizationIds !== undefined) {
      await prisma.staffOrganization.deleteMany({ where: { staffId: staff.id } });
      if (organizationIds.length > 0) {
        await prisma.staffOrganization.createMany({
          data: organizationIds.map((orgId: number) => ({ staffId: staff.id, organizationId: orgId })),
        });
      }
    }

    const full = await prisma.staffMember.findUnique({
      where: { id: staff.id },
      include: {
        user: { select: { id: true, email: true, role: true, active: true } },
        staffOrgs: { include: { organization: true } },
      },
    });
    res.json(full);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar personal' });
  }
}

export async function deleteStaff(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staffMember.findUnique({ where: { id: parseInt(id) }, include: { user: true } });

    await prisma.staffMember.delete({ where: { id: parseInt(id) } });

    // Also delete linked user account if exists
    if (staff?.userId) {
      await prisma.user.delete({ where: { id: staff.userId } });
    }

    res.json({ message: 'Personal eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar personal' });
  }
}
