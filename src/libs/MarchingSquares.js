/**
 * Copyright (c) 2012-2014, Michael Bostock All rights reserved.
 * Marching Squares algorithm for contour generation.
 */

export const geom = {};

const d3GeomContourDx = [1, 0, 1, 1, -1, 0, -1, 1, 0, 0, 0, 0, -1, 0, -1, NaN];
const d3GeomContourDy = [0, -1, 0, 0, 0, -1, 0, 0, 1, -1, 1, 1, 0, -1, 0, NaN];

export function dGeomContourStart(grid) {
  let x = 0, y = 0;
  while (!grid(x, y)) {
    if (x === 0) { x = y + 1; y = 0; }
    else { x -= 1; y += 1; }
  }
  return [x, y];
}

geom.contour = function(grid, start) {
  let s = start || dGeomContourStart(grid),
    c = [],
    x = s[0], y = s[1],
    dx = 0, dy = 0,
    pdx = NaN, pdy = NaN,
    i = 0;

  do {
    i = 0;
    if (grid(x - 1, y - 1)) i += 1;
    if (grid(x, y - 1)) i += 2;
    if (grid(x - 1, y)) i += 4;
    if (grid(x, y)) i += 8;

    if (i === 6) { dx = pdy === -1 ? -1 : 1; dy = 0; }
    else if (i === 9) { dx = 0; dy = pdx === 1 ? -1 : 1; }
    else { dx = d3GeomContourDx[i]; dy = d3GeomContourDy[i]; }

    if (dx != pdx && dy != pdy) { c.push([x, y]); pdx = dx; pdy = dy; }
    x += dx;
    y += dy;
  } while (s[0] != x || s[1] != y);

  return c;
};
