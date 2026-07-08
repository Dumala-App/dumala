import { activationFlagsSchema } from '../persistence/schemas';
import {
  STORAGE_KEYS,
  readJsonStorage,
  writeJsonStorage,
  type StorageLike
} from '../persistence/storage';
import type { ActivationFlags } from './milestones';

const SECTION = 'Getting started';

// Reads the active team's activation flags. Registered in storageSchemas, so the
// value is validated on read and snapshotted per-team on workspace switch.
export const readActivationFlags = (storage?: StorageLike): ActivationFlags =>
  readJsonStorage(STORAGE_KEYS.activation, activationFlagsSchema, {}, SECTION, storage);

// Records the first time a milestone was reached. Idempotent: an already-recorded
// milestone is left untouched, which is what lets the caller emit its activation
// event exactly once.
export const recordActivationFlag = (
  id: string,
  reachedAtIso: string,
  storage?: StorageLike
): { flags: ActivationFlags; changed: boolean } => {
  const current = readActivationFlags(storage);
  if (current[id]) return { flags: current, changed: false };
  const next = { ...current, [id]: reachedAtIso };
  writeJsonStorage(STORAGE_KEYS.activation, next, storage);
  return { flags: next, changed: true };
};
