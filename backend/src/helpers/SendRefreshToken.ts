import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";
  const isHttps = process.env.BACKEND_URL?.startsWith("https") || process.env.FRONTEND_URL?.startsWith("https");
  
  res.cookie("jrt", token, {
    httpOnly: true,
    secure: isHttps || isProduction, // Use secure cookies with HTTPS
    sameSite: isHttps || isProduction ? "strict" : "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};
