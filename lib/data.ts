// This file now uses Supabase for data storage
// The old in-memory implementation has been replaced with database queries

export {
  getUserByUsername,
  getUserStats,
  listProjects,
  getProject,
  createProject,
  voteProject,
  listComments,
  addComment,
  listProjectsByUser,
} from "./data-supabase"
