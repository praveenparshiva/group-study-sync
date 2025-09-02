-- Add position column to post_groups table for post ordering within groups
ALTER TABLE public.post_groups 
ADD COLUMN position integer DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_post_groups_group_position ON public.post_groups(group_id, position);

-- Update existing records to have sequential positions (0, 1, 2, ...)
WITH ordered_posts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY created_at) - 1 as new_position
  FROM public.post_groups
)
UPDATE public.post_groups 
SET position = ordered_posts.new_position
FROM ordered_posts 
WHERE public.post_groups.id = ordered_posts.id;