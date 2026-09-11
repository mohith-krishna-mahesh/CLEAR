// SPDX-License-Identifier: Apache-2.0

export enum TransferStatus {
  INITIATED = 0,
  COMPLETED = 1,
  CANCELLED = 2,
  EXPIRED = 3
}

export type TransferStatusString = "INITIATED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export interface Transfer {
  transferId: bigint;
  sourceRegistry: string;
  destRegistry: string;
  creditReference: string; // 0x-prefixed 32-byte hex
  amount: bigint;
  status: TransferStatus;
  initiatedAt: bigint;
  completedAt: bigint;
}
