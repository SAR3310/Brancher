// ============================================================
// Brancher - Input Validation Schemas (Zod)
// Centralized validation untuk semua endpoints
// ============================================================
const { z } = require("zod");

// ========== AUTH SCHEMAS ==========
const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, underscore"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter"),
});

const LoginSchema = z.object({
  email: z.string().min(1, "Email/Username harus diisi"),
  password: z.string().min(1, "Password harus diisi"),
});

// ========== BRANCH SCHEMAS ==========
const CreateBranchSchema = z.object({
  name: z
    .string()
    .min(2, "Nama branch minimal 2 karakter")
    .max(50, "Nama branch maksimal 50 karakter"),
  description: z
    .string()
    .max(200, "Deskripsi maksimal 200 karakter")
    .optional()
    .default(""),
});

const JoinBranchSchema = z.object({
  code: z
    .string()
    .length(8, "Kode invite harus 8 karakter"),
});

// ========== CHANNEL SCHEMAS ==========
const CreateChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Nama channel minimal 2 karakter")
    .max(30, "Nama channel maksimal 30 karakter")
    .regex(/^[a-z0-9-]+$/, "Nama channel hanya huruf kecil, angka, dash"),
  type: z
    .enum(["text", "announce", "voice"])
    .default("text"),
});

// ========== MESSAGE SCHEMAS ==========
const SendMessageSchema = z.object({
  content: z
    .string()
    .max(5000, "Pesan maksimal 5000 karakter")
    .refine((val) => val.trim().length > 0 || val === "", {
      message: "Pesan tidak boleh hanya whitespace",
    })
    .optional(),
  reply_to: z.number().positive().optional(),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
});

const EditMessageSchema = z.object({
  content: z
    .string()
    .max(5000, "Pesan maksimal 5000 karakter")
    .refine((val) => val.trim().length > 0, {
      message: "Pesan tidak boleh kosong atau hanya whitespace",
    }),
});

const ReactMessageSchema = z.object({
  emoji: z
    .string()
    .regex(/^[\p{Emoji}]$/u, "Hanya emoji yang valid")
    .max(2, "Hanya 1 emoji"),
});

// ========== MEMBER SCHEMAS ==========
const ChangeMemberRoleSchema = z.object({
  role: z
    .enum(["owner", "admin", "member"])
    .refine((role) => role !== "owner", {
      message: "Tidak bisa ubah owner",
    }),
});

// ========== FRIEND SCHEMAS ==========
const AddFriendSchema = z.object({
  username: z
    .string()
    .min(1, "Username harus diisi"),
});

// ========== FILE UPLOAD SCHEMAS ==========
const FileUploadSchema = z.object({
  size: z
    .number()
    .max(10 * 1024 * 1024, "File terlalu besar (max 10MB)"),
  mimetype: z
    .string()
    .refine(
      (type) => {
        // Allowed file types
        const allowed = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        return allowed.includes(type);
      },
      {
        message: "Tipe file tidak didukung (hanya image, PDF, dokumen)",
      }
    ),
});

// ========== SEARCH SCHEMAS ==========
const SearchMessagesSchema = z.object({
  q: z
    .string()
    .min(1, "Query harus diisi")
    .max(100, "Query maksimal 100 karakter"),
  channel: z.number().positive().optional(),
});

// ========== MIDDLEWARE FACTORY ==========
/**
 * Creates validation middleware for request body
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {function} Express middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({ error: messages.join("; ") });
      }
      return res.status(400).json({ error: "Validasi gagal" });
    }
  };
}

/**
 * Creates validation middleware for query parameters
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {function} Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(400).json({ error: messages.join("; ") });
      }
      return res.status(400).json({ error: "Validasi gagal" });
    }
  };
}

/**
 * Sanitize content untuk XSS prevention
 * @param {string} content - Raw content
 * @returns {string} Sanitized content
 */
function sanitizeContent(content) {
  if (!content) return "";
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

module.exports = {
  // Auth schemas
  RegisterSchema,
  LoginSchema,
  
  // Branch schemas
  CreateBranchSchema,
  JoinBranchSchema,
  
  // Channel schemas
  CreateChannelSchema,
  
  // Message schemas
  SendMessageSchema,
  EditMessageSchema,
  ReactMessageSchema,
  
  // Member schemas
  ChangeMemberRoleSchema,
  
  // Friend schemas
  AddFriendSchema,
  
  // File schemas
  FileUploadSchema,
  
  // Search schemas
  SearchMessagesSchema,
  
  // Middleware
  validateBody,
  validateQuery,
  sanitizeContent,
};
