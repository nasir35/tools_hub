import { IStudyPdf } from "../models/StudyPdf";
import { IStudySession } from "../models/StudySession";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const getStudyVaultUserId = async (): Promise<string> => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Session token expired or invalid JWE
  }
  // Fallback to primary local user ID for desktop / unauthenticated study vault access
  return "6a287127a7c097938db52058";
};

export const normalizeTimestamp = (candidate: any): string | null => {
  if (!candidate) return null;
  const date = candidate instanceof Date ? candidate : new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const toPlainPdf = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: obj.sid,
    userId: obj.userId,
    projectId: obj.projectId || null,
    storageType: obj.storageType || (obj.localPath ? "local" : "cloudinary"),
    localPath: obj.localPath || null,
    filename: obj.filename,
    originalName: obj.originalName,
    uploadedAt: normalizeTimestamp(obj.uploadedAt),
    updatedAt: normalizeTimestamp(obj.updatedAt),
    sessionCount: obj.sessionCount || 0,
    studyData: {
      annotations: obj.studyData?.annotations || [],
      snips: obj.studyData?.snips || [],
      updatedAt: normalizeTimestamp(obj.studyData?.updatedAt),
      lastOpenedAt: normalizeTimestamp(obj.studyData?.lastOpenedAt),
    },
  };
};

export const toPlainSession = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: obj.ssid,
    userId: obj.userId,
    projectId: obj.projectId || null,
    title: obj.title,
    startedAt: normalizeTimestamp(obj.startedAt),
    endedAt: normalizeTimestamp(obj.endedAt),
    snips: obj.snips || [],
  };
};

export const toPlainNote = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: obj.nid,
    userId: obj.userId,
    projectId: obj.projectId || null,
    title: obj.title || "",
    content: obj.content || "",
    attachments: obj.attachments || [],
    attachmentFolder: obj.attachmentFolder || null,
    thumbnail: obj.thumbnail || null,
    pinned: !!obj.pinned,
    createdAt: normalizeTimestamp(obj.createdAt),
    updatedAt: normalizeTimestamp(obj.updatedAt),
  };
};

export const toPlainProject = (doc: any) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: obj.pid,
    userId: obj.userId,
    name: obj.name,
    color: obj.color || "#6366f1",
    createdAt: normalizeTimestamp(obj.createdAt),
    updatedAt: normalizeTimestamp(obj.updatedAt),
  };
};

