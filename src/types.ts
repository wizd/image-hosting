export interface ImageMetadata {
  originalName: string
  fileId: string
  fileExtension: string
  fullUrl: string
}

export interface CollectionResponse {
  collectionId: string
  collectionName: string
}

export interface UploadResponse {
  collectionId: string
  images: ImageMetadata[]
}
