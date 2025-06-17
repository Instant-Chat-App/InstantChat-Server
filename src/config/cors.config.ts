import cors from "cors";

const corsOptions = {
  origin: "http://localhost:3000", // Specify exact frontend origin
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

export default cors(corsOptions);
