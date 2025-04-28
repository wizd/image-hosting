# Image Hosting Service

A TypeScript service for image hosting that allows users to create collections and upload images.

## Features

- Create named collections with unique IDs
- Upload multiple images to collections
- Automatic UUID generation for collections and files
- JSON responses with image metadata
- Configurable storage and URL paths

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a `.env` file based on `.env.example`:
   \`\`\`
   DATA_ROOT=./data
   IMAGE_ROOT_URL=http://localhost:3000/images/
   PORT=3000
   \`\`\`
4. Build the project:
   \`\`\`
   npm run build
   \`\`\`
5. Start the server:
   \`\`\`
   npm start
   \`\`\`

## API Endpoints

### Create a Collection

\`\`\`
POST /collections
Content-Type: application/json

{
  "name": "my-collection"
}
\`\`\`

Response:
\`\`\`json
{
  "collectionId": "550e8400-e29b-41d4-a716-446655440000",
  "collectionName": "my-collection"
}
\`\`\`

### Upload Images to a Collection

\`\`\`
POST /collections/:collectionId/images
Content-Type: multipart/form-data

images: [file1, file2, ...]
\`\`\`

Response:
\`\`\`json
{
  "collectionId": "550e8400-e29b-41d4-a716-446655440000",
  "images": [
    {
      "originalName": "image1.jpg",
      "fileId": "7b52009b-bfd9-4e2b-0d93-839c55f10200",
      "fileExtension": ".jpg",
      "fullUrl": "http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/7b52009b-bfd9-4e2b-0d93-839c55f10200.jpg"
    },
    {
      "originalName": "image2.png",
      "fileId": "3fdba35f-04cd-4e2e-8c84-96a4413c0201",
      "fileExtension": ".png",
      "fullUrl": "http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/3fdba35f-04cd-4e2e-8c84-96a4413c0201.png"
    }
  ]
}
\`\`\`

### Access an Image

\`\`\`
GET /images/:collectionId/:fileId
\`\`\`

Returns the image file.
