export interface ImageData {
  originalName: string
  fileId: string
  fileExtension: string
  fullUrl: string
}

export interface CollectionResponse {
  collectionId: string
  collectionName: string
  userId?: string
}

export interface UploadResponse {
  collectionId: string
  images: ImageData[]
}

export interface AuthResponse {
  user: {
    id: string
    username: string
    email: string
    createdAt: string
  }
  token: string
}
