import { WEB_EDGES } from "./geodesic";
import styles from "./web.module.css";

/**
 * THE WEB BEHIND THE NAME.
 *
 * A projected geodesic sphere sitting behind the hero's h1 — the thing that
 * reads as a cloud at a glance and as a web once you look at it.
 *
 * WHY THIS IS SVG AND NOT WEBGL. There is a 3D version of this object in
 * lib/webgl/scenes/HeroObject.tsx and it has never been able to appear
 * reliably, for a structural reason rather than a tuning one: the background
 * is a full-viewport drei View, and drei views do not composite. Each one
 * scissors to its tracked element and clears that rectangle before drawing
 * its own scene, so two overlapping views means whichever draws second
 * erases the other. Both orders were observed — the object painted over by
 * the backdrop, and the backdrop punched through by a flat hole exactly
 * where the name sits.
 *
 * Moving it into the environment's own scene removed that conflict and it
 * still did not draw, while a probe mesh at the identical position did.
 *
 * So this is not a fallback. It is the better medium for what was wanted:
 *
 *   - It is genuinely 2D, which is what was asked for.
 *   - It is vector, so the lines stay hairline-crisp at any pixel ratio,
 *     where WebGL lines are quantised to the drawing buffer.
 *   - It renders on the server, so it is in the first paint rather than
 *     after a dynamic import, a canvas and a shader compile.
 *   - It survives the NONE quality tier, where there is no canvas at all —
 *     the one tier where the hero was previously left completely bare.
 *
 * It is decorative and carries no information, so it is aria-hidden and
 * outside the tab order. Motion is CSS-only and respects the page's motion
 * setting — see web.module.css.
 */
export function NameWeb() {
  return (
    <svg
      className={styles.web}
      viewBox="-1.25 -1.25 2.5 2.5"
      aria-hidden="true"
      focusable="false"
      // Preserves the circle rather than stretching it to the name's box:
      // a geodesic sphere squashed to a wide rectangle stops reading as a
      // sphere and starts reading as a net.
      preserveAspectRatio="xMidYMid meet"
    >
      <g className={styles.spin}>
        {WEB_EDGES.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            /*
              Depth drives opacity, which is the whole illusion. Edges on the
              far side of the sphere are drawn fainter, so a flat drawing
              reads as a volume. Without it this is a tangle; with it, the
              eye resolves a sphere immediately.
            */
            style={{ opacity: 0.1 + edge.depth * 0.9 }}
          />
        ))}
      </g>
    </svg>
  );
}
