export interface Annotation {
  id: string;
  page: number;
  tool: "pen" | "highlight" | "eraser";
  color: string;
  size: number;
  points: { xn: number; yn: number }[] | { x: number; y: number }[];
  createdAt?: string | null;
}

export interface Snip {
  id: string;
  attachmentPath: string;
  cloudinaryId?: string | null;
  filename: string;
  note: string;
  page: number;
  rect?: { x: number; y: number; width: number; height: number } | null;
  pdfName?: string | null;
  pdfId?: string | null;
  sourcePdfId?: string | null;
  sourceSnipId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  _uploading?: boolean;
}

export interface StudyData {
  annotations: Annotation[];
  snips: Snip[];
  updatedAt?: string | null;
  lastOpenedAt?: string | null;
}

export interface PdfEntry {
  id: string;
  userId: string;
  projectId?: string | null;
  storageType: "local" | "cloudinary";
  localPath?: string | null;
  filename: string;
  originalName: string;
  uploadedAt: string;
  updatedAt?: string | null;
  sessionCount?: number;
  studyData: StudyData;
}

export interface SessionEntry {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  startedAt: string;
  endedAt?: string | null;
  snips: Snip[];
}

export interface StudyTimeEntry {
  id: string;
  userId: string;
  pdfId?: string | null;
  pdfName: string;
  sessionId?: string | null;
  duration: number;
  date: string;
}

export interface TabItem {
  id: string;
  pdfEntry: PdfEntry;
  rotation: number;
  scale: number;
  tool: "select" | "pen" | "highlight" | "eraser" | "snip";
  penColor: string;
  highlightColor: string;
  penSize: number;
  currentPage: number;
  totalPages: number;
  nasPanelOpen: boolean;
}

export interface AttachmentItem {
  filename?: string;
  type?: string;
  path: string;
  folder?: string | null;
  publicId?: string | null;
  size?: number;
}

export interface ProjectEntry {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NoteEntry {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  content: string;
  attachments?: AttachmentItem[];
  attachmentFolder?: string | null;
  thumbnail?: string | null;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

