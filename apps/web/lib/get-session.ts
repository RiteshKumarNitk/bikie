import { headers } from "next/headers";
import { auth } from "@bikie/auth";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}
