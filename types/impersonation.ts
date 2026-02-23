export type ActorType = "employee" | "employer";

export interface ImpersonationContext {
  impersonating: boolean;
  actorType: ActorType;
  scenario?: string;
}
