import { createAdminApplication } from "./application/admin.application";
import { createAdminRepositoryAdapter } from "./infrastructure/repositories.adapter";
import type { AdministrationPorts } from "./ports";

export type AdministrationModule = {
  ports: AdministrationPorts;
  admin: ReturnType<typeof createAdminApplication>;
};

export type AdministrationDeps = Partial<AdministrationPorts>;

export function createAdministrationModule(overrides: AdministrationDeps = {}): AdministrationModule {
  const ports: AdministrationPorts = {
    admin: overrides.admin ?? createAdminRepositoryAdapter(),
  };
  return {
    ports,
    admin: createAdminApplication(ports),
  };
}

let defaultModule: AdministrationModule | null = null;

export function getAdministrationModule(): AdministrationModule {
  if (!defaultModule) defaultModule = createAdministrationModule();
  return defaultModule;
}

export function setAdministrationModuleForTests(module: AdministrationModule | null): void {
  defaultModule = module;
}

export type { AdministrationPorts, AdminExportType } from "./ports";
export {
  buildCsv,
  sanitizeCsvCell,
  MAX_ADMIN_CSV_ROWS,
  exportFilenameFor,
} from "./domain/csv";
