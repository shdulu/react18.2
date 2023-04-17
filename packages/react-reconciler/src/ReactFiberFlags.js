// Don't change these values. They're used by React Dev Tools.
export const NoFlags = /*     0  无         */ 0b0000000000000000000000000000;
export const PerformedWork = /*             */ 0b0000000000000000000000000001;
export const Placement = /*    2  插入      */ 0b0000000000000000000000000010;
export const DidCapture = /*                */ 0b0000000000000000000010000000;
export const Hydrating = /*                 */ 0b0000000000000001000000000000;

// You can change the rest (and add more).
export const Update = /*      4   更新      */ 0b0000000000000000000000000100;

/* Skipped value:                                 0b0000000000000000000000001000; */

export const ChildDeletion = /* 子节点删除   */ 0b0000000000000000000000010000;
export const ContentReset = /*                 */ 0b0000000000000000000000100000;
export const Callback = /*                     */ 0b0000000000000000000001000000;
/* Used by DidCapture:                            0b0000000000000000000010000000; */

export const Ref = /*                          */ 0b0000000000000000001000000000;

export const Visibility = /*                   */ 0b0000000000000010000000000000;

export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility;
