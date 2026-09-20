import { IStudyPdf } from "../models/StudyPdf";
import { IStudySession } from "../models/StudySession";

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
