-- Create project_images table for multiple images per project
-- This allows projects to have multiple images instead of just one thumbnail

-- Create project_images table
CREATE TABLE IF NOT EXISTS project_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS project_images_project_id_idx ON project_images(project_id);
CREATE INDEX IF NOT EXISTS project_images_project_order_idx ON project_images(project_id, display_order);
CREATE INDEX IF NOT EXISTS project_images_thumbnail_idx ON project_images(project_id, is_thumbnail) WHERE is_thumbnail = TRUE;

-- Enable RLS
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_images
-- Anyone can view project images (since projects are public)
CREATE POLICY "Anyone can view project images" ON project_images
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only project authors can manage their project images  
CREATE POLICY "Project authors can manage their project images" ON project_images
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_images.project_id 
            AND projects.author_id = auth.uid()::text
        )
        OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_images.project_id 
            AND projects.author_id = auth.uid()::text
        )
        OR 
        auth.role() = 'service_role'
    );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_project_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_project_images_updated_at_trigger ON project_images;
CREATE TRIGGER update_project_images_updated_at_trigger
    BEFORE UPDATE ON project_images
    FOR EACH ROW
    EXECUTE FUNCTION update_project_images_updated_at();

-- Migrate existing project thumbnail_url to project_images table
-- Only migrate if thumbnail_url exists and project_images table is empty for that project
INSERT INTO project_images (project_id, image_url, alt_text, display_order, is_thumbnail)
SELECT 
    id as project_id,
    thumbnail_url as image_url,
    title || ' thumbnail' as alt_text,
    0 as display_order,
    true as is_thumbnail
FROM projects 
WHERE thumbnail_url IS NOT NULL 
  AND thumbnail_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM project_images 
    WHERE project_images.project_id = projects.id
  );

-- Add comments for documentation
COMMENT ON TABLE project_images IS 'Multiple images for each project with ordering and thumbnail designation';
COMMENT ON COLUMN project_images.project_id IS 'Foreign key to projects table';
COMMENT ON COLUMN project_images.image_url IS 'URL of the image (Supabase storage or external)';
COMMENT ON COLUMN project_images.alt_text IS 'Alt text for accessibility';
COMMENT ON COLUMN project_images.display_order IS 'Order for displaying images (0 = first)';
COMMENT ON COLUMN project_images.is_thumbnail IS 'Whether this image is the main thumbnail';

-- Note: We keep the thumbnail_url column in projects table for backward compatibility
-- but new projects will primarily use the project_images table
