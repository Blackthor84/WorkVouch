/**
 * Seat-based limits: active employer team members.
 * Seats ≠ users globally; seats = active employer team members.
 * Use canAddSeat before inviting a team member.
 */

export function canAddSeat(currentSeats: number, seatLimit: number): boolean {
  if (seatLimit === Infinity) return true;
  return currentSeats < seatLimit;
}
