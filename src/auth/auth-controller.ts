import type { Request, Response } from "express"
import { userService } from "./user-service"
import { generateToken } from "../middleware/auth-middleware"
import type { LoginRequest, RegisterRequest } from "./auth-types"

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body as RegisterRequest

      if (!username || !email || !password) {
        res.status(400).json({ error: "Username, email, and password are required" })
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" })
        return
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters long" })
        return
      }

      const existingUser = await userService.findByEmail(email)
      if (existingUser) {
        res.status(400).json({ error: "User with this email already exists" })
        return
      }

      const user = await userService.createUser(username, email, password)
      const token = generateToken({ id: user.id, email: user.email })

      res.status(201).json({
        user,
        token,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Failed to register user" })
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginRequest

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" })
        return
      }

      const user = await userService.findByEmail(email)
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" })
        return
      }

      const isPasswordValid = await userService.validatePassword(user, password)
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" })
        return
      }

      const token = generateToken({ id: user.id, email: user.email })

      res.status(200).json({
        user: userService.toUserDTO(user),
        token,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Failed to login" })
    }
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore - user is added by auth middleware
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const user = await userService.findById(userId)
      if (!user) {
        res.status(404).json({ error: "User not found" })
        return
      }

      res.status(200).json({ user: userService.toUserDTO(user) })
    } catch (error) {
      console.error("Get profile error:", error)
      res.status(500).json({ error: "Failed to get user profile" })
    }
  }
}

export const authController = new AuthController()
