import type { ReportDTO } from "@bikie/types";
import type { ReportStatus } from "../domain/moderation";
import type { ReportCreateInput, TrustSafetyPorts } from "../ports";

type ReportRow = {
  id: string;
  reporter: ReportDTO["reporter"];
  targetType: ReportDTO["targetType"];
  targetId: string;
  reason: ReportDTO["reason"];
  details: string | null;
  status: ReportDTO["status"];
  reviewedBy: ReportDTO["reviewedBy"];
  reviewedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
};

function toReportDTO(row: ReportRow): ReportDTO {
  return {
    id: row.id,
    reporter: row.reporter,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createReportApplication(ports: TrustSafetyPorts) {
  return {
    async create(reporterId: string, input: ReportCreateInput): Promise<ReportDTO> {
      const row = await ports.reports.create({ reporterId, ...input });
      const full = (await ports.reports.findByIdWithRelations(row.id)) as ReportRow;
      const dto = toReportDTO(full);
      await ports.realtime.publishToAdmins("report_created", dto);
      return dto;
    },

    async list(filters: { status?: string; targetType?: string }): Promise<ReportDTO[]> {
      const rows = (await ports.reports.findMany(filters)) as ReportRow[];
      return rows.map(toReportDTO);
    },

    async updateStatus(
      reportId: string,
      adminId: string,
      status: ReportStatus,
      resolutionNote?: string,
    ): Promise<ReportDTO | null> {
      const existing = await ports.reports.findById(reportId);
      if (!existing) return null;
      const updated = await ports.reports.updateStatus(reportId, status, adminId, resolutionNote);
      const full = (await ports.reports.findByIdWithRelations(updated.id)) as ReportRow;
      return toReportDTO(full);
    },
  };
}

export type ReportApplication = ReturnType<typeof createReportApplication>;
