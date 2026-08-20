import type { AtsEmployer } from "../../../core/models/Employer";
import type { GreenhouseUser } from "../models";

export const USER_MAPPER_NAME = "greenhouse.userMapper";

export function mapGreenhouseUserToEmployerContext(
  user: GreenhouseUser,
  employerAccountId: string
): AtsEmployer {
  return {
    employerAccountId,
    companyName: user.name,
    metadata: {
      greenhouseUserId: user.id,
      email: user.email,
      mapper: USER_MAPPER_NAME,
    },
  };
}

export function parseGreenhouseUser(payload: Record<string, unknown>): GreenhouseUser {
  return payload as unknown as GreenhouseUser;
}
