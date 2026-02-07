import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../types';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address, cargo: user.cargo, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesion' });
  }
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const { email, password, name, role, phone, address, cargo } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El email ya esta registrado' });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role, phone, address, cargo },
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, cargo: true, active: true },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, cargo: true, avatar: true, active: true },
    });

    if (!user || !user.active) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, cargo: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, role, phone, address, cargo, active, password } = req.body;

    const data: any = { name, role, phone, address, cargo, active };
    if (password) {
      data.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, cargo: true, active: true },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, phone, address, cargo } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, address, cargo },
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, cargo: true, avatar: true, active: true },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Contrasena actual y nueva (min 6 caracteres) son requeridas' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Contrasena actual incorrecta' });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    res.json({ message: 'Contrasena actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contrasena' });
  }
}
