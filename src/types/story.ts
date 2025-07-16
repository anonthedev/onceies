export interface UserInput {
  id: string;
  created_at: string;
  plot: string;
  age_group: string | null;
  characters: string | null;
  title: string;
}

export interface Story {
  id: string;
  created_at: string;
  cover_image: string | null;
  user_id: string;
}

export interface Chapter {
  id: string;
  created_at: string;
  user_id: string | null;
  story_id: string | null;
  title: string;
  content: string;
  image_prompt: string;
  image_url: string | null;
  chapter_number: number;
}

export interface ChapterOutline {
  title: string;
  summary: string;
  chapter_number: number;
}

export interface StoryOutline {
  title: string;
  chapters: ChapterOutline[];
}

export interface StoryWithChapters extends Story {
  chapters: Chapter[];
  user_inputs?: UserInput;
}

export interface StoryFormData {
  title: string;
  ageGroup: string;
  plot: string;
  characters: string;
} 