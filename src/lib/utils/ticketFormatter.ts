/**
 * Format ticket number to TK-XXXXXX format
 * @param ticketNumber - The numeric ticket number
 * @returns Formatted ticket ID (e.g., "TK-100001")
 */
export function formatTicketId(ticketNumber: number): string {
  return `TK-${ticketNumber.toString().padStart(6, '0')}`;
}

/**
 * Parse ticket ID back to number
 * @param ticketId - The formatted ticket ID (e.g., "TK-100001")
 * @returns The numeric ticket number
 */
export function parseTicketId(ticketId: string): number | null {
  const match = ticketId.match(/^TK-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

