/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const NoFlags = /*  0  */ 0b0000;

// Represents whether effect should fire.
export const HasEffect = /* 1 */ 0b0001; // 标识有 effect 只有有此flag才会执行effect

// Represents the phase in which the effect (not the clean-up) fires.
export const Insertion = /* 2 */ 0b0010;
export const Layout = /*  4  */ 0b0100; // useLayoutEffect 标识
export const Passive = /* 8  */ 0b1000; // useEffect 标识
