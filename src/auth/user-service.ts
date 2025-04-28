import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import type { User, UserDTO } from "./auth-types"

const DATA_ROOT = process.env.DATA_ROOT || path.join(__dirname, "../../data")
const USERS_FILE = path.join(DATA_ROOT, "users.json")

// Ensure users file exists
if (!fs.existsSync(DATA_ROOT)) {
  fs.mkdirSync(DATA_ROOT, { recursive: true })
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
}

export class UserService {
  private getUsers(): User[] {
    const data = fs.readFileSync(USERS_FILE, "utf8")
    return JSON.parse(data)
  }

  private saveUsers(users: User[]): void {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  }

  public async findByEmail(email: string): Promise<User | undefined> {
    const users = this.getUsers()
    return users.find((user) => user.email === email)
  }

  public async findById(id: string): Promise<User | undefined> {
    const users = this.getUsers()
    return users.find((user) => user.id === id)
  }

  public async createUser(username: string, email: string, password: string): Promise<UserDTO> {
    const users = this.getUsers()

    // Check if user already exists
    if (users.some((user) => user.email === email)) {
      throw new Error("User with this email already exists")
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.saveUsers(users)

    // Return user without password
    return this.toUserDTO(newUser)
  }

  public async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }

  public toUserDTO(user: User): UserDTO {
    const { id, username, email, createdAt } = user
    return { id, username, email, createdAt }
  }
}

export const userService = new UserService()
