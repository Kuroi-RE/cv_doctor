export type UserRole = "user" | "superadmin";

export type CvStatus = "uploaded" | "parsing" | "analyzing" | "completed" | "failed";

export type RecommendationPriority = "high" | "medium" | "low";

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CV {
  id: string;
  user_id: string;
  original_file_name: string;
  stored_file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  status: CvStatus;
  parsed_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  cv_id: string;
  overall_score: number;
  aspect_scores: AspectScores;
  highlights: string[];
  issues: string[];
  summary: string;
  created_at: string;
}

export interface AspectScores {
  structure: number;
  content: number;
  relevance: number;
  language: number;
  completeness: number;
}

export interface RecommendationItem {
  id: string;
  analysis_result_id: string;
  section_name: string;
  issue: string;
  suggestion: string;
  priority: RecommendationPriority;
  created_at: string;
}

export interface AnalysisLog {
  id: string;
  cv_id: string;
  user_id: string;
  status: string;
  message: string;
  error_message: string | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AiAnalysisOutput {
  overallScore: number;
  aspectScores: {
    structure: number;
    content: number;
    relevance: number;
    language: number;
    completeness: number;
  };
  highlights: string[];
  issues: string[];
  recommendations: {
    sectionName: string;
    issue: string;
    suggestion: string;
    priority: RecommendationPriority;
  }[];
  summary: string;
}
