import { ImageResponse } from "next/og";
import { site } from "@/lib/data/site";
import { profile } from "@/lib/data/profile";

/**
 * Open Graph card.
 *
 * Generated from the site's own tokens rather than a separate piece of
 * artwork — the name at display scale on the site's near-black ground, a
 * hairline rule, and the positioning line. It is the hero, reduced to a
 * still. No new visual identity, and nothing thrown away later when real
 * imagery arrives.
 *
 * Rendered by Satori at build time, so it ships as a static PNG with no
 * runtime cost. Satori supports a subset of CSS — plain values only here,
 * no custom properties, no clamp().
 */
/** See the note in app/robots.ts — required by the static export build. */
export const dynamic = "force-static";

export const size = { width: site.ogImage.width, height: site.ogImage.height };
export const contentType = "image/png";
export const alt = site.ogImage.alt;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          // --c-base, with the accent bloom the hero carries.
          background:
            "radial-gradient(900px 500px at 18% 0%, #14141c 0%, #0a0a0c 62%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 96, height: 1, background: "#33333f" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#63636f",
            }}
          >
            Portfolio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: -6,
              color: "#f2f2f4",
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              marginTop: 28,
              paddingTop: 28,
              borderTop: "1px solid #22222b",
              fontSize: 40,
              letterSpacing: -1,
              color: "#9a9aa6",
            }}
          >
            {profile.headline}
          </div>
        </div>

        {/* The five worlds, as the site's own accents. */}
        <div style={{ display: "flex", gap: 14 }}>
          {["#4f7cff", "#9d5cff", "#00c2a8", "#ff6b3d", "#5c86a8"].map((c) => (
            <div
              key={c}
              style={{ width: 56, height: 3, background: c }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
