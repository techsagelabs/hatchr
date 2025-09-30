-- Migration: Add media_type column to project_images table
-- Date: December 30, 2025
-- Purpose: Support video uploads alongside images in projects

-- Add media_type column with default value 'image' for existing records
ALTER TABLE project_images 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Update existing records to have media_type = 'image'
UPDATE project_images SET media_type = 'image' WHERE media_type IS NULL;

-- Add index for media_type queries
CREATE INDEX IF NOT EXISTS project_images_media_type_idx ON project_images(media_type);

-- Add comment to document the column
COMMENT ON COLUMN project_images.media_type IS 'Type of media: image or video';

