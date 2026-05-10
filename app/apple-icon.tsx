import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, rgb(255, 246, 232), rgb(199, 242, 255))"
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, rgb(249, 115, 22), rgb(14, 165, 233))"
          }}
        >
          <div
            style={{
            color: "white",
            fontSize: 74,
            fontWeight: 900,
            letterSpacing: -4
          }}
          >
            P
          </div>
        </div>
      </div>
    ),
    size
  );
}

