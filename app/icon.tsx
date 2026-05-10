import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, rgb(255, 246, 232) 0%, rgb(255, 219, 188) 50%, rgb(199, 242, 255) 100%)"
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, rgb(249, 115, 22), rgb(14, 165, 233))",
            boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)"
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 170,
              fontWeight: 900,
              letterSpacing: -8
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

