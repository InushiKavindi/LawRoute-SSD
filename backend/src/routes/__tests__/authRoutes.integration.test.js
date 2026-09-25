import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import authRoutes from "../authRoutes.js";
import User from "../../models/userModel.js";

const JWT_SECRET = "test-secret";
const TEST_USER_ID = "507f1f77bcf86cd799439011";

process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = "test"; // So secure cookie is false

const testToken = jwt.sign({ id: TEST_USER_ID }, JWT_SECRET, { expiresIn: '1d' });
const invalidToken = jwt.sign({ id: TEST_USER_ID }, "wrong-secret", { expiresIn: '1d' });

describe("Auth Routes & Cookie Authentication", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRoutes);
    
    // Setup a dummy protected endpoint to test authMiddleware
    import("../../middleware/authMiddleware.js").then(({ protect }) => {
      app.get("/api/users/me", protect, (req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });
    });
  });

  describe("Cookie Authentication Lifecycle", () => {
    it("1. successful login sets auth_token HttpOnly cookie", async () => {
      const mockUser = {
        _id: TEST_USER_ID,
        role: "user",
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, "findOne").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/auth_token=/);
      expect(res.headers["set-cookie"][0]).toMatch(/HttpOnly/);
      // Ensure token is NOT in JSON response
      expect(res.body.token).toBeUndefined();
    });

    it("2. protected endpoint succeeds with valid cookie", async () => {
      jest.spyOn(User, "findById").mockResolvedValue({ _id: TEST_USER_ID, role: "user" });

      const res = await request(app)
        .get("/api/users/me")
        .set("Cookie", `auth_token=${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("3. protected endpoint fails without cookie", async () => {
      const res = await request(app)
        .get("/api/users/me");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Not authorized/);
    });

    it("4. invalid token is rejected", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Cookie", `auth_token=${invalidToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token failed/);
    });

    it("5. logout clears cookie", async () => {
      const res = await request(app)
        .post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/auth_token=;/);
      // It sets max-age=0 or expires in past
    });

    it("6. protected endpoint fails after logout", async () => {
      // Simulate logout by just not sending a cookie, exactly what a browser does after clearCookie
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });
  });
});
