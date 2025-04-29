import { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // 记录请求开始
  console.log(
    `[${new Date().toISOString()}] ${method} ${originalUrl} - IP: ${ip}`
  );

  // 在响应结束时记录
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`
    );
  });

  next();
};
